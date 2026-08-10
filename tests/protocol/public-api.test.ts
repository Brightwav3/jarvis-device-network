import assert from "node:assert/strict";
import test from "node:test";
import { PROTOCOL_VERSION, parseDeviceMessage } from "../../src/index.js";

test("exposes protocol validation through the package entry point", () => {
  assert.equal(PROTOCOL_VERSION, "1");
  assert.equal(
    parseDeviceMessage({
      protocol_version: "1",
      type: "device.heartbeat",
      message_id: "m-heartbeat",
      timestamp: "2026-08-10T10:00:00.000Z",
      device_id: "bedroom-01",
      session_id: "s-1",
      payload: {},
    }).ok,
    true,
  );
});
