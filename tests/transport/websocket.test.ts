import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { PreSharedTokenAuthenticator } from "../../src/auth/authenticator.js";
import { DeviceNetworkServer } from "../../src/transport/websocket.js";

function receive(socket: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString()) as Record<string, unknown>));
    socket.once("error", reject);
  });
}

test("registers an authenticated WebSocket device on an ephemeral port", async () => {
  const server = new DeviceNetworkServer({ authenticator: new PreSharedTokenAuthenticator({ "bedroom-01": "secret" }) });
  const { port } = await server.start();
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise<void>((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });

  socket.send(JSON.stringify({
    protocol_version: "1", type: "device.register", message_id: "m-1", timestamp: "2026-08-10T10:00:00.000Z",
    payload: { device_id: "bedroom-01", device_type: "room_satellite", capabilities: ["audio.input"], credential: "secret" },
  }));

  const response = await receive(socket);
  assert.equal(response.type, "device.registered");
  assert.equal(server.registry.get("bedroom-01")?.state, "online");
  socket.close();
  await server.stop();
});

test("rejects invalid credentials without registering the device", async () => {
  const server = new DeviceNetworkServer({ authenticator: new PreSharedTokenAuthenticator({ "bedroom-01": "secret" }) });
  const { port } = await server.start();
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise<void>((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  socket.send(JSON.stringify({ protocol_version: "1", type: "device.register", message_id: "m-1", timestamp: "2026-08-10T10:00:00.000Z", payload: { device_id: "bedroom-01", device_type: "room_satellite", capabilities: [], credential: "wrong" } }));
  const response = await receive(socket);
  assert.equal((response.error as { code: string }).code, "DEVICE_AUTH_FAILED");
  assert.equal(server.registry.get("bedroom-01"), undefined);
  socket.close();
  await server.stop();
});
