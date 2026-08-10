import assert from "node:assert/strict";
import test from "node:test";
import { PreSharedTokenAuthenticator } from "../../src/auth/authenticator.js";
import { DeviceSimulator } from "../../simulator/client.js";
import { DeviceNetworkServer } from "../../src/transport/websocket.js";

test("connects two software devices and returns simulated command results", async () => {
  const server = new DeviceNetworkServer({ authenticator: new PreSharedTokenAuthenticator({ "bedroom-01": "a", "kitchen-01": "b" }) });
  const { port } = await server.start();
  const url = `ws://127.0.0.1:${port}`;
  const bedroom = new DeviceSimulator({ url, device_id: "bedroom-01", device_type: "room_satellite", credential: "a", capabilities: ["audio.output"] });
  const kitchen = new DeviceSimulator({ url, device_id: "kitchen-01", device_type: "room_satellite", credential: "b", capabilities: ["display.output"] });

  await Promise.all([bedroom.connect(), kitchen.connect()]);
  assert.equal(server.registry.list().filter(({ state }) => state === "online").length, 2);
  const result = await server.sendCommand("bedroom-01", { capability: "audio.output", operation: "test", arguments: {} });
  assert.equal(result.ok, true);
  assert.deepEqual(result.result, { simulated: true });
  await Promise.all([bedroom.disconnect(), kitchen.disconnect(), server.stop()]);
});
