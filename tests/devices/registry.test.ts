import assert from "node:assert/strict";
import test from "node:test";
import { DeviceRegistry } from "../../src/devices/registry.js";

const device = {
  device_id: "bedroom-01",
  device_type: "room_satellite",
  room: "bedroom",
  name: "Bedroom satellite",
  software_version: "0.1.0",
  protocol_version: "1" as const,
  capabilities: ["audio.input", "audio.output"],
};

test("registers an online device and finds it by room and capability", () => {
  const registry = new DeviceRegistry();
  const registered = registry.register(device);

  assert.equal(registered.state, "online");
  assert.notEqual(registered.session_id, "");
  assert.deepEqual(registry.findByRoom("bedroom").map(({ device_id }) => device_id), ["bedroom-01"]);
  assert.deepEqual(registry.findByCapability("audio.output").map(({ device_id }) => device_id), ["bedroom-01"]);
});

test("replaces duplicate connections and ignores stale disconnects", () => {
  const registry = new DeviceRegistry();
  const first = registry.register(device);
  const replacement = registry.register({ ...device, name: "Replacement" });

  assert.notEqual(replacement.session_id, first.session_id);
  assert.equal(registry.disconnect(device.device_id, first.session_id), false);
  assert.equal(registry.get(device.device_id)?.state, "online");
  assert.equal(registry.disconnect(device.device_id, replacement.session_id), true);
  assert.equal(registry.get(device.device_id)?.state, "offline");
});

test("returns detached record snapshots", () => {
  const registry = new DeviceRegistry();
  const record = registry.register(device);
  record.capabilities.push("display.output");

  assert.deepEqual(registry.get(device.device_id)?.capabilities, ["audio.input", "audio.output"]);
});
