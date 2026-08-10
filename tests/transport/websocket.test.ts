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

test("transports commands, results, and unsolicited device events", async () => {
  const server = new DeviceNetworkServer({ authenticator: new PreSharedTokenAuthenticator({ "bedroom-01": "secret" }) });
  const { port } = await server.start();
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise<void>((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  socket.send(JSON.stringify({ protocol_version: "1", type: "device.register", message_id: "m-1", timestamp: "2026-08-10T10:00:00.000Z", payload: { device_id: "bedroom-01", device_type: "room_satellite", capabilities: ["audio.output"], credential: "secret" } }));
  await receive(socket);

  const event = new Promise<Record<string, unknown>>((resolve) => server.onDeviceEvent(resolve));
  const command = server.sendCommand("bedroom-01", { capability: "audio.output", operation: "test", arguments: {} });
  const request = await receive(socket);
  const commandId = (request.payload as { command_id: string }).command_id;
  socket.send(JSON.stringify({ protocol_version: "1", type: "command.result", message_id: "m-result", timestamp: "2026-08-10T10:00:00.000Z", device_id: "bedroom-01", session_id: request.session_id, payload: { command_id: commandId, ok: true, result: { simulated: true } } }));
  socket.send(JSON.stringify({ protocol_version: "1", type: "device.event", message_id: "m-event", timestamp: "2026-08-10T10:00:00.000Z", device_id: "bedroom-01", session_id: request.session_id, payload: { event: "button.pressed", payload: {} } }));

  assert.equal((await command).ok, true);
  assert.equal((await event).event, "button.pressed");
  socket.close();
  await server.stop();
});

test("marks a connected device offline after missing heartbeats", async () => {
  const server = new DeviceNetworkServer({ authenticator: new PreSharedTokenAuthenticator({ "bedroom-01": "secret" }), heartbeatTimeoutMs: 20, heartbeatSweepIntervalMs: 5 });
  const { port } = await server.start();
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise<void>((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
  socket.send(JSON.stringify({ protocol_version: "1", type: "device.register", message_id: "m-1", timestamp: "2026-08-10T10:00:00.000Z", payload: { device_id: "bedroom-01", device_type: "room_satellite", capabilities: [], credential: "secret" } }));
  await receive(socket);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(server.registry.get("bedroom-01")?.state, "offline");
  socket.close();
  await server.stop();
});
