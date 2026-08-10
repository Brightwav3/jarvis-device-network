import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
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
  heartbeatTimeoutMs?: number;
  heartbeatSweepIntervalMs?: number;
};

export type DeviceCommand = { capability: string; operation: string; arguments: Record<string, unknown> };
export type CommandResult = { command_id: string; ok: boolean; result?: Record<string, unknown>; error?: { code: string; message: string } };

export class DeviceNetworkServer {
  readonly registry: DeviceRegistry;
  readonly #authenticator: DeviceAuthenticator;
  readonly #host: string;
  readonly #requestedPort: number;
  readonly #heartbeatTimeoutMs: number;
  readonly #heartbeatSweepIntervalMs: number;
  readonly #events = new EventEmitter();
  readonly #sockets = new Map<string, WebSocket>();
  readonly #commands = new Map<string, { resolve: (result: CommandResult) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  #http?: Server;
  #wss?: WebSocketServer;
  #heartbeatTimer?: NodeJS.Timeout;

  constructor(options: DeviceNetworkServerOptions) {
    this.registry = options.registry ?? new DeviceRegistry();
    this.#authenticator = options.authenticator;
    this.#host = options.host ?? "127.0.0.1";
    this.#requestedPort = options.port ?? 0;
    this.#heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 30_000;
    this.#heartbeatSweepIntervalMs = options.heartbeatSweepIntervalMs ?? 1_000;
  }

  async start(): Promise<{ host: string; port: number }> {
    if (this.#http !== undefined) throw new Error("Server already started");
    this.#http = createServer();
    this.#wss = new WebSocketServer({ server: this.#http, maxPayload: 64 * 1024 });
    this.#wss.on("connection", (socket) => this.#handleConnection(socket));
    this.#heartbeatTimer = setInterval(() => this.registry.expire(new Date(), this.#heartbeatTimeoutMs), this.#heartbeatSweepIntervalMs);
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
    if (this.#heartbeatTimer !== undefined) clearInterval(this.#heartbeatTimer);
    this.#heartbeatTimer = undefined;
    for (const [commandId, pending] of this.#commands) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Server stopped"));
      this.#commands.delete(commandId);
    }
    if (wss !== undefined) await new Promise<void>((resolve) => wss.close(() => resolve()));
    if (http !== undefined) await new Promise<void>((resolve, reject) => http.close((error) => error === undefined ? resolve() : reject(error)));
  }

  onDeviceEvent(listener: (event: { device_id: string; event: string; payload: Record<string, unknown> }) => void): () => void {
    this.#events.on("device.event", listener);
    return () => this.#events.off("device.event", listener);
  }

  sendCommand(deviceId: string, command: DeviceCommand, timeoutMs = 5_000): Promise<CommandResult> {
    const record = this.registry.get(deviceId);
    if (record === undefined || record.state !== "online") return Promise.reject(new Error("Device is not online"));
    if (!record.capabilities.includes(command.capability)) return Promise.reject(new Error("Capability unavailable"));
    const socket = this.#sockets.get(record.session_id);
    if (socket === undefined) return Promise.reject(new Error("Device session is unavailable"));
    const command_id = randomUUID();
    this.#send(socket, { protocol_version: PROTOCOL_VERSION, type: "command.request", message_id: randomUUID(), timestamp: new Date().toISOString(), device_id: deviceId, session_id: record.session_id, payload: { command_id, ...command } });
    return new Promise<CommandResult>((resolve, reject) => {
      const timer = setTimeout(() => { this.#commands.delete(command_id); reject(new Error("Command timeout")); }, timeoutMs);
      this.#commands.set(command_id, { resolve, reject, timer });
    });
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
        this.#sockets.set(record.session_id, socket);
        return this.#send(socket, { protocol_version: PROTOCOL_VERSION, type: "device.registered", message_id: crypto.randomUUID(), timestamp: new Date().toISOString(), device_id: record.device_id, session_id: record.session_id, payload: { device_id: record.device_id, session_id: record.session_id } });
      }
      if (parsed.value.device_id !== session.device_id || parsed.value.session_id !== session.session_id) {
        return this.#send(socket, protocolError("SESSION_INVALID", "Session is not authoritative"));
      }
      this.registry.touch(session.device_id, session.session_id);
      if (parsed.value.type === "command.result") {
        const pending = this.#commands.get(parsed.value.payload.command_id);
        if (pending !== undefined) {
          clearTimeout(pending.timer);
          this.#commands.delete(parsed.value.payload.command_id);
          pending.resolve(parsed.value.payload);
        }
      }
      if (parsed.value.type === "device.event") {
        this.#events.emit("device.event", { device_id: session.device_id, ...parsed.value.payload });
      }
    });
    socket.on("close", () => {
      if (session !== undefined) {
        this.#sockets.delete(session.session_id);
        this.registry.disconnect(session.device_id, session.session_id);
      }
    });
  }

  #decode(raw: unknown): unknown {
    try { return JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw)); } catch { return undefined; }
  }

  #send(socket: WebSocket, message: unknown): void {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  }
}
