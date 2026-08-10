import { createServer, type Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { DeviceAuthenticator } from "../auth/authenticator.js";
import { DeviceRegistry } from "../devices/registry.js";
import { protocolError } from "../protocol/errors.js";
import { parseDeviceMessage } from "../protocol/validation.js";
import { PROTOCOL_VERSION } from "../protocol/version.js";

export type DeviceNetworkServerOptions = {
  authenticator: DeviceAuthenticator;
  registry?: DeviceRegistry;
  host?: string;
  port?: number;
};

export class DeviceNetworkServer {
  readonly registry: DeviceRegistry;
  readonly #authenticator: DeviceAuthenticator;
  readonly #host: string;
  readonly #requestedPort: number;
  #http?: Server;
  #wss?: WebSocketServer;

  constructor(options: DeviceNetworkServerOptions) {
    this.registry = options.registry ?? new DeviceRegistry();
    this.#authenticator = options.authenticator;
    this.#host = options.host ?? "127.0.0.1";
    this.#requestedPort = options.port ?? 0;
  }

  async start(): Promise<{ host: string; port: number }> {
    if (this.#http !== undefined) throw new Error("Server already started");
    this.#http = createServer();
    this.#wss = new WebSocketServer({ server: this.#http, maxPayload: 64 * 1024 });
    this.#wss.on("connection", (socket) => this.#handleConnection(socket));
    await new Promise<void>((resolve, reject) => {
      this.#http?.once("error", reject);
      this.#http?.listen(this.#requestedPort, this.#host, resolve);
    });
    const address = this.#http.address();
    if (address === null || typeof address === "string") throw new Error("Server has no TCP address");
    return { host: this.#host, port: address.port };
  }

  async stop(): Promise<void> {
    const wss = this.#wss;
    const http = this.#http;
    this.#wss = undefined;
    this.#http = undefined;
    if (wss !== undefined) await new Promise<void>((resolve) => wss.close(() => resolve()));
    if (http !== undefined) await new Promise<void>((resolve, reject) => http.close((error) => error === undefined ? resolve() : reject(error)));
  }

  #handleConnection(socket: WebSocket): void {
    let session: { device_id: string; session_id: string } | undefined;
    socket.on("message", async (raw) => {
      const parsed = parseDeviceMessage(this.#decode(raw));
      if (!parsed.ok) return this.#send(socket, parsed);
      if (session === undefined) {
        if (parsed.value.type !== "device.register") {
          return this.#send(socket, protocolError("DEVICE_NOT_REGISTERED", "Device must register first"));
        }
        const payload = parsed.value.payload;
        if (!(await this.#authenticator.authenticate({ device_id: payload.device_id, credential: payload.credential }))) {
          return this.#send(socket, protocolError("DEVICE_AUTH_FAILED", "Device authentication failed", { device_id: payload.device_id }));
        }
        const { credential: _credential, ...registration } = payload;
        const record = this.registry.register({ ...registration, protocol_version: PROTOCOL_VERSION });
        session = { device_id: record.device_id, session_id: record.session_id };
        return this.#send(socket, { protocol_version: PROTOCOL_VERSION, type: "device.registered", message_id: crypto.randomUUID(), timestamp: new Date().toISOString(), device_id: record.device_id, session_id: record.session_id, payload: { device_id: record.device_id, session_id: record.session_id } });
      }
      if (parsed.value.device_id !== session.device_id || parsed.value.session_id !== session.session_id) {
        return this.#send(socket, protocolError("SESSION_INVALID", "Session is not authoritative"));
      }
      this.registry.touch(session.device_id, session.session_id);
    });
    socket.on("close", () => { if (session !== undefined) this.registry.disconnect(session.device_id, session.session_id); });
  }

  #decode(raw: unknown): unknown {
    try { return JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw)); } catch { return undefined; }
  }

  #send(socket: WebSocket, message: unknown): void {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  }
}
