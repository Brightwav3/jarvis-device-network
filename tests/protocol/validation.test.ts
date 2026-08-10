import assert from "node:assert/strict";
import test from "node:test";
import { parseDeviceMessage } from "../../src/protocol/validation.js";

const timestamp = "2026-08-10T10:00:00.000Z";

test("accepts a valid registration message", () => {
  const result = parseDeviceMessage({
    protocol_version: "1",
    type: "device.register",
    message_id: "m-register",
    timestamp,
    payload: {
      device_id: "bedroom-01",
      device_type: "room_satellite",
      name: "Bedroom satellite",
      room: "bedroom",
      software_version: "0.1.0",
      capabilities: ["audio.input", "audio.output"],
      credential: "test-token",
    },
  });

  assert.equal(result.ok, true);
  if (result.ok && result.value.type === "device.register") {
    assert.equal(result.value.payload.device_type, "room_satellite");
  }
});

test("rejects an unsupported protocol version explicitly", () => {
  assert.deepEqual(
    parseDeviceMessage({ protocol_version: "2", type: "device.heartbeat", message_id: "m-1", timestamp, payload: {} }),
    { ok: false, error: { code: "UNSUPPORTED_PROTOCOL_VERSION", message: "Unsupported protocol version", context: { protocol_version: "2" } } },
  );
});

test("rejects malformed, unknown, and oversized messages without throwing", () => {
  const malformed = parseDeviceMessage({ protocol_version: "1", type: "device.heartbeat", message_id: "", timestamp, payload: {} });
  const unknown = parseDeviceMessage({ protocol_version: "1", type: "device.unknown", message_id: "m-1", timestamp, payload: {} });
  const oversized = parseDeviceMessage({ protocol_version: "1", type: "device.heartbeat", message_id: "m-1", timestamp, payload: {} }, 1);

  assert.equal(malformed.ok, false);
  assert.equal(unknown.ok, false);
  assert.deepEqual(oversized, { ok: false, error: { code: "MESSAGE_TOO_LARGE", message: "Message exceeds maximum size", context: { max_bytes: "1" } } });
});

test("accepts a typed command request", () => {
  const result = parseDeviceMessage({
    protocol_version: "1", type: "command.request", message_id: "m-command", timestamp,
    device_id: "bedroom-01", session_id: "s-1",
    payload: { command_id: "c-1", capability: "audio.output", operation: "test", arguments: {} },
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.type, "command.request");
});
