import type { CommandResult, DeviceCommand, DeviceNetworkServer } from "../transport/websocket.js";
import type { DeviceRecord } from "../devices/registry.js";

/** Narrow, transport-free boundary intended for a central runtime component. */
export class CentralSystemDeviceAdapter {
  constructor(private readonly network: DeviceNetworkServer) {}

  start(): Promise<{ host: string; port: number }> { return this.network.start(); }
  stop(): Promise<void> { return this.network.stop(); }
  listDevices(): DeviceRecord[] { return this.network.registry.list(); }
  sendCommand(deviceId: string, command: DeviceCommand, timeoutMs?: number): Promise<CommandResult> {
    return this.network.sendCommand(deviceId, command, timeoutMs);
  }
  onDeviceEvent(listener: Parameters<DeviceNetworkServer["onDeviceEvent"]>[0]): () => void {
    return this.network.onDeviceEvent(listener);
  }
}
