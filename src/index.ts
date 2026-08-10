export type { Capability } from "./devices/capabilities.js";
export type { DeviceIdentity, DeviceMetadata } from "./devices/identity.js";
export { protocolError } from "./protocol/errors.js";
export type { ProtocolError, ProtocolErrorCode } from "./protocol/errors.js";
export type { DeviceMessage, DeviceMessageMap, MessageType } from "./protocol/messages.js";
export { parseDeviceMessage } from "./protocol/validation.js";
export type { ParseDeviceMessageResult } from "./protocol/validation.js";
export { PROTOCOL_VERSION } from "./protocol/version.js";
export type { ProtocolVersion } from "./protocol/version.js";
