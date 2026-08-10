import { randomUUID } from "node:crypto";
import WebSocket from "ws";

export type DeviceSimulatorOptions = {
  url: string;
  device_id: string;
  device_type: string;
  credential: string;
  capabilities: string[];
  name?: string;
  room?: string;
  software_version?: string;
  heartbeatIntervalMs?: number;
};

export class DeviceSimulator {
  readonly #options: DeviceSimulatorOptions;
  #socket?: WebSocket;
  #sessionId?: string;
  #heartbeat?: NodeJS.Timeout;

  constructor(options: DeviceSimulatorOptions) {
    this.#options = { ...options, capabilities: [...options.capabilities] };
  }

  async connect(): Promise<void> {
    if (this.#socket !== undefined) throw new Error("Simulator is already connected");
    const socket = new WebSocket(this.#options.url);
    this.#socket = socket;
    await new Promise<void>((resolve, reject) => {
      socket.once("open", resolve);
      socket.once("error", reject);
    });
    const acknowledged = new Promise<void>((resolve, reject) => {
      const onMessage = (raw: WebSocket.RawData) => {
        const message = this.#decode(raw);
        if (message?.type === "device.registered") {
          this.#sessionId = String((message.payload as Record<string, unknown>).session_id);
          socket.off("message", onMessage);
          resolve();
        } else if (message?.ok === false) {
          socket.off("message", onMessage);
          reject(new Error(String((message.error as Record<string, unknown>).code)));
        }
      };
      socket.on("message", onMessage);
    });
    socket.on("message", (raw) => this.#handleMessage(this.#decode(raw)));
    socket.send(JSON.stringify({ protocol_version: "1", type: "device.register", message_id: randomUUID(), timestamp: new Date().toISOString(), payload: { device_id: this.#options.device_id, device_type: this.#options.device_type, name: this.#options.name, room: this.#options.room, software_version: this.#options.software_version, capabilities: this.#options.capabilities, credential: this.#options.credential } }));
    await acknowledged;
    this.#heartbeat = setInterval(() => this.#send("device.heartbeat", {}), this.#options.heartbeatIntervalMs ?? 10_000);
  }

  async disconnect(): Promise<void> {
    if (this.#heartbeat !== undefined) clearInterval(this.#heartbeat);
    this.#heartbeat = undefined;
    const socket = this.#socket;
    this.#socket = undefined;
    this.#sessionId = undefined;
    if (socket === undefined || socket.readyState === socket.CLOSED) return;
    await new Promise<void>((resolve) => { socket.once("close", resolve); socket.close(); });
  }

  emitEvent(event: string, payload: Record<string, unknown> = {}): void {
    this.#send("device.event", { event, payload });
  }

  #handleMessage(message: Record<string, unknown> | undefined): void {
    if (message?.type !== "command.request") return;
    const payload = message.payload as Record<string, unknown>;
    this.#send("command.result", { command_id: payload.command_id, ok: true, result: { simulated: true } });
  }

  #send(type: string, payload: Record<string, unknown>): void {
    if (this.#socket?.readyState !== WebSocket.OPEN || this.#sessionId === undefined) return;
    this.#socket.send(JSON.stringify({ protocol_version: "1", type, message_id: randomUUID(), timestamp: new Date().toISOString(), device_id: this.#options.device_id, session_id: this.#sessionId, payload }));
  }

  #decode(raw: WebSocket.RawData): Record<string, unknown> | undefined {
    try { return JSON.parse(raw.toString()) as Record<string, unknown>; } catch { return undefined; }
  }
}
