import { z } from "zod";
import type { DeviceMessage } from "./messages.js";
import { protocolError, type ProtocolError } from "./errors.js";
import { PROTOCOL_VERSION } from "./version.js";

const nonEmpty = z.string().trim().min(1);
const timestamp = z.string().datetime({ offset: true });
const record = z.record(z.unknown());

const envelope = z.object({
  protocol_version: z.literal(PROTOCOL_VERSION),
  message_id: nonEmpty,
  timestamp,
});

const registeredMessage = envelope.extend({
  type: z.literal("device.register"),
  payload: z.object({
    device_id: nonEmpty,
    device_type: nonEmpty,
    name: nonEmpty.optional(),
    room: nonEmpty.optional(),
    software_version: nonEmpty.optional(),
    capabilities: z.array(nonEmpty).max(128),
    credential: nonEmpty,
  }).strict(),
}).strict();

const sessionMessage = envelope.extend({
  device_id: nonEmpty,
  session_id: nonEmpty,
});

const deviceMessageSchema = z.discriminatedUnion("type", [
  registeredMessage,
  sessionMessage.extend({ type: z.literal("device.heartbeat"), payload: z.object({}).strict() }).strict(),
  sessionMessage.extend({ type: z.literal("device.event"), payload: z.object({ event: nonEmpty, payload: record }).strict() }).strict(),
  sessionMessage.extend({
    type: z.literal("command.request"),
    payload: z.object({ command_id: nonEmpty, capability: nonEmpty, operation: nonEmpty, arguments: record }).strict(),
  }).strict(),
  sessionMessage.extend({
    type: z.literal("command.result"),
    payload: z.object({
      command_id: nonEmpty,
      ok: z.boolean(),
      result: record.optional(),
      error: z.object({ code: nonEmpty, message: nonEmpty }).strict().optional(),
    }).strict(),
  }).strict(),
]);

export type ParseDeviceMessageResult =
  | { ok: true; value: DeviceMessage }
  | ProtocolError;

function serializedSize(value: unknown): number | undefined {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? undefined : Buffer.byteLength(serialized, "utf8");
  } catch {
    return undefined;
  }
}

/** Converts untrusted JSON-compatible input to a validated protocol message. */
export function parseDeviceMessage(value: unknown, maxBytes = 64 * 1024): ParseDeviceMessageResult {
  const size = serializedSize(value);
  if (size === undefined) return protocolError("INVALID_MESSAGE", "Malformed message");
  if (size > maxBytes) {
    return protocolError("MESSAGE_TOO_LARGE", "Message exceeds maximum size", { max_bytes: String(maxBytes) });
  }

  if (typeof value === "object" && value !== null && "protocol_version" in value) {
    const version = value.protocol_version;
    if (typeof version === "string" && version !== PROTOCOL_VERSION) {
      return protocolError("UNSUPPORTED_PROTOCOL_VERSION", "Unsupported protocol version", { protocol_version: version });
    }
  }

  const parsed = deviceMessageSchema.safeParse(value);
  if (!parsed.success) return protocolError("INVALID_MESSAGE", "Malformed message");

  return { ok: true, value: parsed.data as DeviceMessage };
}
