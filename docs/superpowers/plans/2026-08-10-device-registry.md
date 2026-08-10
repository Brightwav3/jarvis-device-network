# Device Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the in-memory device registry, session identities, deterministic replacement behavior, lifecycle transitions, and metadata queries.

**Architecture:** `DeviceRegistry` is transport-independent state. Registration creates a new opaque session, atomically replaces an existing active session for the same stable identity, and emits typed lifecycle events. Queries return immutable snapshots.

**Tech Stack:** Node.js 22, strict TypeScript ESM, node:test with tsx.

## Global Constraints

- No networking or authentication behavior belongs in this milestone.
- `device_id` is stable; `session_id` is generated per registration.
- New registration replaces the existing active session for the same device identity.

---

### Task 1: Registry behavior

**Files:**
- Create: `src/devices/session.ts`
- Create: `src/devices/registry.ts`
- Create: `tests/devices/registry.test.ts`

**Interfaces:**
- Produces: `DeviceLifecycleState`, `DeviceRecord`, `DeviceRegistry`, `register(input)`, `disconnect(deviceId, sessionId)`, `get(deviceId)`, `list()`, `findByRoom(room)`, `findByCapability(capability)`.

- [ ] Write failing tests proving registration produces an online record with a new session, a duplicate identity replaces the old session, stale session disconnect is ignored, and room/capability queries do not expose mutable state.
- [ ] Run `npm test -- tests/devices/registry.test.ts`; expect a missing-module failure.
- [ ] Implement the smallest in-memory map-backed registry satisfying those behaviors; generate sessions with `crypto.randomUUID()` and clone records on return.
- [ ] Run `npm test -- tests/devices/registry.test.ts` and `npm run typecheck`; expect both to pass.

### Task 2: Public boundary and documentation

**Files:**
- Modify: `src/index.ts`
- Modify: `ARCHITECTURE.md`
- Modify: `PROGRESS.md`

- [ ] Add a failing package-entry import test for `DeviceRegistry`.
- [ ] Export registry contracts, document replacement/lifecycle policy, and mark Milestone 2 complete.
- [ ] Run `npm run verify`, commit with `feat: add device registry`, and push the commit.
