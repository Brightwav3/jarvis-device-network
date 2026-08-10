# Device Network Work Plan

## Goal

Build headless, agent-oriented device communication infrastructure. Future endpoints identify themselves, advertise metadata and capabilities, maintain presence, exchange validated structured messages, accept commands, emit events, and disconnect or reconnect cleanly. All development and tests must work without physical hardware.

## Scope

The project provides a versioned device protocol, stable device identity, registration, capability advertisement, registry queries, lifecycle and liveness, structured command and event transport, an authentication foundation, a software simulator, tests, and protocol documentation.

It explicitly excludes AI, agent runtime, GUI or mobile interfaces, physical firmware, audio/video/sensor behavior, smart-home integrations, browser control, and other device-specific features.

## Design constraints

- Device identity is stable and distinct from ephemeral connections/sessions.
- The protocol remains independent from central-system internals and device hardware.
- Runtime validation treats every network message as untrusted.
- Devices require authentication before becoming available.
- A newer authenticated connection deterministically replaces a prior active connection for the same device identity.
- Secrets must not appear in normal logs.
- Every important behavior is independently testable without hardware, network access, or paid services.
- The runtime remains headless and machine-facing; product naming is not part of the protocol or runtime contract.

## Milestones

1. **Protocol Foundation:** versioned envelope, typed message map, runtime validation, structured errors, identity, capabilities.
2. **Device Registry:** metadata, session identities, lifecycle states, duplicate-connection policy, room and capability queries.
3. **WebSocket Transport:** local server, registration handshake, framed messages, clean disconnect.
4. **Authentication:** replaceable authenticator interface and development pre-shared credentials.
5. **Heartbeat and reconnection:** last-seen tracking, configurable timeout, reconnect, stale-session invalidation.
6. **Commands and events:** typed request/result flow, timeouts, cancellation foundation, unsolicited events.
7. **Simulator:** configurable CLI clients supporting multiple independent devices.
8. **Central-system adapter:** narrow typed integration boundary while retaining independent testability.
9. **Hardening:** malformed input, size limits, timeouts, replacement connections, shutdown, resource cleanup, and redaction.

## Definition of done

v0.1 is complete when a local simulator authenticates and registers a stable identity, advertises metadata and capabilities, stays online through heartbeats, becomes offline after timeout, reconnects with a new session, follows duplicate-connection policy, handles typed commands and events, safely rejects invalid input and unsupported versions, isolates device failures, exposes a narrow integration boundary, and passes automated tests without physical hardware.

