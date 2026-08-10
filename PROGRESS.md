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

## Next milestone

Milestone 3: WebSocket Transport — local server, registration handshake, structured message transport, and clean disconnect.
