import assert from "node:assert/strict";
import test from "node:test";
import { PreSharedTokenAuthenticator } from "../../src/auth/authenticator.js";
import { CentralSystemDeviceAdapter } from "../../src/adapter/central-system.js";
import { DeviceNetworkServer } from "../../src/transport/websocket.js";

test("exposes lifecycle and device queries without transport details", async () => {
  const adapter = new CentralSystemDeviceAdapter(new DeviceNetworkServer({ authenticator: new PreSharedTokenAuthenticator({}) }));
  const address = await adapter.start();
  assert.equal(address.host, "127.0.0.1");
  assert.deepEqual(adapter.listDevices(), []);
  await adapter.stop();
});
