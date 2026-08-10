# Progress

## Current state

Foundation and Milestone 1 are complete. The repository provides a documented, typed, runtime-validated protocol foundation. No network server, simulator, authentication behavior, or device-specific behavior has been implemented.

## Baseline checks

Passed on 2026-08-10:

- `npm run typecheck`
- `npm test`
- `npm run build`

## Completed milestone

Milestone 1: Protocol Foundation — versioned envelope, typed message map, runtime validation, structured errors, device identity, and capability representation.

Milestone 2: Device Registry — in-memory metadata/session state, online/offline lifecycle, replacement connection policy, stale-session protection, and room/capability queries.

Milestone 3: WebSocket Transport — local ephemeral-port server, validated registration handshake, structured acknowledgements, and clean connection lifecycle.

Milestone 4: Authentication — replaceable authenticator contract and pre-shared-token local implementation; rejected credentials never register a device.

Milestone 5: Heartbeat and Reconnection — configurable heartbeat expiry, offline transition, reconnect registration, and stale-session invalidation.

Milestone 6: Commands and Events — server-to-device typed command transport with result/timeout foundation and device-to-server unsolicited event delivery.

## Next milestone

Milestone 7: Simulator — configurable CLI clients supporting multiple independent software devices.
