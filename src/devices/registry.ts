import type { Capability } from "./capabilities.js";
import type { DeviceIdentity, DeviceMetadata } from "./identity.js";
import { createSessionId, type SessionId } from "./session.js";
import type { ProtocolVersion } from "../protocol/version.js";

export type DeviceLifecycleState = "online" | "offline";

export type DeviceRegistration = DeviceIdentity & DeviceMetadata & {
  protocol_version: ProtocolVersion;
  capabilities: Capability[];
};

export type DeviceRecord = DeviceRegistration & {
  session_id: SessionId;
  state: DeviceLifecycleState;
  last_seen: string;
};

function snapshot(record: DeviceRecord): DeviceRecord {
  return { ...record, capabilities: [...record.capabilities] };
}

/** Transport-independent device state with last-writer-wins session replacement. */
export class DeviceRegistry {
  readonly #devices = new Map<string, DeviceRecord>();

  register(input: DeviceRegistration, now = new Date()): DeviceRecord {
    const record: DeviceRecord = {
      ...input,
      capabilities: [...input.capabilities],
      session_id: createSessionId(),
      state: "online",
      last_seen: now.toISOString(),
    };
    this.#devices.set(record.device_id, record);
    return snapshot(record);
  }

  get(deviceId: string): DeviceRecord | undefined {
    const record = this.#devices.get(deviceId);
    return record === undefined ? undefined : snapshot(record);
  }

  list(): DeviceRecord[] {
    return [...this.#devices.values()].map(snapshot);
  }

  findByRoom(room: string): DeviceRecord[] {
    return this.list().filter((record) => record.room === room);
  }

  findByCapability(capability: Capability): DeviceRecord[] {
    return this.list().filter((record) => record.capabilities.includes(capability));
  }

  touch(deviceId: string, sessionId: SessionId, now = new Date()): boolean {
    const record = this.#devices.get(deviceId);
    if (record === undefined || record.session_id !== sessionId || record.state !== "online") return false;
    record.last_seen = now.toISOString();
    return true;
  }

  disconnect(deviceId: string, sessionId: SessionId, now = new Date()): boolean {
    const record = this.#devices.get(deviceId);
    if (record === undefined || record.session_id !== sessionId || record.state !== "online") return false;
    record.state = "offline";
    record.last_seen = now.toISOString();
    return true;
  }

  /** Marks online records offline when their heartbeat age exceeds the supplied threshold. */
  expire(now: Date, timeoutMs: number): DeviceRecord[] {
    const expired: DeviceRecord[] = [];
    for (const record of this.#devices.values()) {
      if (record.state !== "online" || now.getTime() - Date.parse(record.last_seen) <= timeoutMs) continue;
      record.state = "offline";
      expired.push(snapshot(record));
    }
    return expired;
  }
}
