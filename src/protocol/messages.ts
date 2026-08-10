import type { Capability } from "../devices/capabilities.js";
import type { DeviceIdentity, DeviceMetadata } from "../devices/identity.js";
import type { ProtocolVersion } from "./version.js";

export type DeviceMessageMap = {
  "device.register": DeviceIdentity & DeviceMetadata & { capabilities: Capability[]; credential: string };
  "device.heartbeat": Record<string, never>;
  "device.event": { event: string; payload: Record<string, unknown> };
  "command.request": {
    command_id: string;
    capability: Capability;
    operation: string;
    arguments: Record<string, unknown>;
  };
  "command.result": {
    command_id: string;
    ok: boolean;
    result?: Record<string, unknown>;
    error?: { code: string; message: string };
  };
};

export type MessageType = keyof DeviceMessageMap;

export type DeviceMessage<TType extends MessageType = MessageType> = TType extends MessageType
  ? {
      protocol_version: ProtocolVersion;
      type: TType;
      message_id: string;
      timestamp: string;
      payload: DeviceMessageMap[TType];
    } & (TType extends "device.register"
      ? { device_id?: never; session_id?: never }
      : { device_id: string; session_id: string })
  : never;
