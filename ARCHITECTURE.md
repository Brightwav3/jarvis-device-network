# Architecture

## Purpose

The system provides a headless, machine-facing boundary between a central system and independently implemented devices. A device declares stable identity, metadata, capabilities, protocol version, and liveness; the central system addresses it only through the protocol contract.

## Boundaries

The device network owns protocol validation, device sessions, registry state, authentication, transport lifecycle, commands, events, and observability. It does not own a device's hardware implementation, a user interface, AI behavior, or domain-specific device features.

## Core model

- **Identity:** `device_id` is stable across reconnects; addresses and socket identifiers are not identity.
- **Session:** each successful registration receives an ephemeral session identity.
- **Registry:** device metadata, capability advertisements, liveness, and lifecycle state are queried independently of transport details.
- **Protocol:** all application messages share a versioned envelope and runtime validation.
- **Integration:** consumers receive typed lifecycle, event, and command-result notifications rather than WebSocket frames.

## Protocol foundation

Milestone 1 defines protocol version `1`, the common envelope, device registration identity and metadata, capability advertisements, heartbeats, commands, command results, and events. The parser validates all inbound values before any future transport or registry consumes them. Invalid messages return machine-readable errors and do not throw into the network boundary.

## Registry and sessions

`DeviceRegistry` is an in-memory, transport-independent source of current device state. Registration creates an opaque session ID and makes the device online. A later registration with the same stable `device_id` replaces the current record atomically; commands or disconnects carrying the prior session no longer have authority. Registry queries return detached snapshots so consumers cannot mutate authoritative state.

## Transport and authentication

`DeviceNetworkServer` owns a local WebSocket listener and accepts only validated JSON messages. A connection has no authority until it supplies a `device.register` message with a credential. Authentication is isolated behind `DeviceAuthenticator`; `PreSharedTokenAuthenticator` is the local-development implementation. Credentials are validated but not stored in the registry or included in acknowledgements.

## Liveness, commands, and events

The server periodically expires registry records whose `last_seen` age exceeds the configured heartbeat timeout. Every message from an authoritative session refreshes liveness; devices reconnect by registering again and receive a new session. `sendCommand` routes a typed request only to an online device advertising the required capability, resolves a matching `command.result`, and applies a bounded timeout. `onDeviceEvent` publishes unsolicited typed device events without exposing WebSocket frames to consumers.

## Simulator and central-system boundary

`DeviceSimulator` is a first-class software endpoint for development and tests. It uses the same WebSocket protocol as future hardware, sends heartbeats, simulates successful command results, emits test events, and can reconnect using its stable identity. `CentralSystemDeviceAdapter` offers only lifecycle control, device listing, commands, and device events; a central runtime therefore does not need to import WebSocket classes or inspect network frames.

## Failure behavior

Malformed, unknown, oversized, unauthorized, unregistered, stale-session, unavailable-capability, and timed-out operations fail with bounded, machine-readable results or rejected promises. Per-device connection failures are isolated to the associated session. `stop()` cancels pending command waits and closes the listener cleanly.

## Technology decision

The v0.1 runtime is Node.js 22 with strict TypeScript and ESM. WebSocket over TCP is the planned initial transport, but no transport is implemented in this foundation.
