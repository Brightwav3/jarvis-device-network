# Device Network — rules for agents

This file is loaded automatically. It carries rules, not description.
`README.md` says what this repository owns. `ARCHITECTURE.md` says how it is
shaped. [`docs/decisions/`](docs/decisions/README.md) says why — read it before
changing a boundary.

`AGENTS.md` is a byte-identical copy of this file. Change both or change neither.

Device Network owns protocol validation, device sessions, registry state,
authentication, transport lifecycle, commands, events, and observability. It does
not own a device's hardware implementation, a user interface, AI behaviour, or
domain-specific device features.

## Ecosystem invariants that govern this repository

None currently. When one is added to [`INVARIANTS.md`](../INVARIANTS.md) naming
this repository, quote its sentence verbatim here and in `AGENTS.md`.

## Rules in this repository

1. **`device_id` is identity; addresses and socket identifiers are not.** A device
   keeps its identity across reconnects.
   [ADR 0002](docs/decisions/0002-identity-is-stable-sessions-are-not.md)
2. **A session is ephemeral and loses authority atomically.** A later registration
   with the same `device_id` replaces the record; commands or disconnects carrying
   the prior session no longer act.
3. **A connection has no authority until `device.register` with a credential.** Do
   not accept application messages before that.
4. **Credentials are validated, never stored in the registry, never echoed** in an
   acknowledgement.
5. **Authentication stays behind `DeviceAuthenticator`.**
   `PreSharedTokenAuthenticator` is for local development and must not become a
   production default.
6. **Registry queries return detached snapshots.** Never hand a consumer a live
   reference to authoritative state.
7. **Consumers never see WebSocket frames.** They receive typed lifecycle, event,
   and command-result notifications through `CentralSystemDeviceAdapter`.
8. **Validate before anything downstream consumes a message.** Invalid messages
   return machine-readable errors and do not throw into the network boundary.
9. **Every failure mode is bounded and machine-readable** — malformed, unknown,
   oversized, unauthorized, unregistered, stale-session, unavailable-capability,
   timed-out. Per-device failures stay isolated to their session.
10. **`DeviceSimulator` is first-class.** It uses the same protocol as future
    hardware; keep it working, it is how this repository is tested without devices.
11. **No assistant name, model, or provider** in any protocol message or contract.

## Before you finish

- Changed a boundary, chose between two homes for something, or rejected an
  approach a next agent would try? Write an ADR. The six triggers and the
  template are in [../docs/decisions/README.md](../docs/decisions/README.md).
- Changed the protocol? It is versioned; a change to the envelope or a message
  shape is an ADR, not an edit.
- Edited this file? Copy it to `AGENTS.md` in the same change. They must stay
  byte-identical — Claude Code reads one, Codex reads the other, and a structure
  test compares them.
- Reasoning belongs in `docs/decisions/`, not in `ARCHITECTURE.md`.
