import assert from "node:assert/strict";
import test from "node:test";
import type { DeviceMessage } from "../../src/protocol/messages.js";

test("models a typed registration message", () => {
  const message: DeviceMessage<"device.register"> = {
    protocol_version: "1",
    type: "device.register",
    message_id: "m-1",
    timestamp: "2026-08-10T10:00:00.000Z",
    payload: {
      device_id: "bedroom-01",
      device_type: "room_satellite",
      capabilities: ["audio.input"], credential: "test-token",
    },
  };

  assert.equal(message.payload.device_id, "bedroom-01");
});
