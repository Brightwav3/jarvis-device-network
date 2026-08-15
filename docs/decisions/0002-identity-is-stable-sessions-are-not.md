# ADR 0002: Device identity is stable; a session is ephemeral and loses authority the moment it is replaced

- **Status:** Accepted
- **Date:** 2026-08-15
- **Decision owners:** M.A.R.K. II architecture
- **Retroactive:** migrated from `ARCHITECTURE.md`, where it was correct but filed
  under shape rather than reasoning.

## Context

Devices reconnect. A satellite loses Wi-Fi and comes back, a speaker is power-cycled,
a simulator restarts. Each reconnection produces a new socket, and the natural
shortcut is to treat the connection as the device — address it by socket, key state
by socket, expire it when the socket closes.

That produces two failures that are hard to see from the central system:

- **The device becomes a new device on every reconnect.** Its history, capabilities,
  and any queued work are stranded on an identity that no longer exists.
- **A stale connection retains authority.** A device that reconnects while its old
  socket has not yet been noticed as dead has two sessions, and a command result or
  a disconnect arriving on the old one is accepted as current.

A third pressure: a connection that can send messages before it has proven anything
is a connection that can register as any device it names.

## Decision

**`device_id` is identity and is stable across reconnects.** Addresses and socket
identifiers are never identity.

**Each successful registration receives an ephemeral session identity.** A later
registration with the same `device_id` replaces the current record **atomically**,
and commands or disconnects carrying the prior session no longer have authority.

**A connection has no authority until it supplies `device.register` with a
credential.** Authentication is isolated behind `DeviceAuthenticator`;
`PreSharedTokenAuthenticator` is the local-development implementation. Credentials
are validated but never stored in the registry or included in acknowledgements.

**Liveness is refreshed by any message from an authoritative session**, and the
server expires records whose `last_seen` age exceeds the heartbeat timeout. A device
reconnects by registering again and receives a new session.

**Registry queries return detached snapshots**, so a consumer cannot mutate
authoritative state by holding a reference to it.

**Consumers receive typed lifecycle, event, and command-result notifications**, never
WebSocket frames. `CentralSystemDeviceAdapter` offers only lifecycle control, device
listing, commands, and device events.

## Rejected alternatives

### Treat the connection as the device

Rejected. Every reconnect creates a new device and strands its history, and a stale
socket keeps authority it should have lost.

### Let the device choose its own session id

Rejected. A session is the registry's record of a successful registration. A device
choosing it could resurrect a session the registry has replaced.

### Accept messages before registration and authenticate lazily

Rejected. An unauthenticated connection that can send messages can claim to be any
device, and the registry would have to unwind whatever it accepted.

### Return live registry objects for efficiency

Rejected. A consumer holding a live reference can mutate authoritative state
accidentally, and the bug appears far from where it was caused.

### Expire on socket close rather than heartbeat timeout

Rejected. A socket close is one signal among several and is unreliable on flaky
links. Liveness measured from actual traffic is what the registry can defend.

## Consequences

### Positive

- A device keeps its history and capabilities across reconnects.
- A superseded session cannot act, so a late command result is refused rather than
  accepted.
- The central system never handles a network frame.

### Costs

- Two identities per device to reason about, and confusing them is easy.
- Heartbeat timeout is a tuning parameter: too short expires live devices, too long
  keeps dead ones online.
- Atomic replacement means a reconnect during in-flight work invalidates that work.

## Enforced in

- `docs/protocol/v1.md`

## Explicit non-decisions

This ADR does not choose a production authenticator, does not fix heartbeat or
command timeouts for any deployment, does not decide device provisioning or how a
`device_id` is assigned, and does not commit to WebSocket as the permanent
transport.
