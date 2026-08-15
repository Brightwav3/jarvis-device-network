# ADR 0001: TypeScript on Node.js 22

## Status

Accepted.

## Context

*Added 2026-08-15 when this record was brought to the current ADR format. The
decision is unchanged.*

Device Network is one repository in an ecosystem of eleven that a single agent must
be able to move between without relearning the shape. Its own requirements — an
asynchronous server runtime, WebSocket support, explicit contracts for machine
consumers, and runtime validation of untrusted input — are met by several stacks.

What is not met by several stacks is consistency with the repositories it sits
next to.

## Decision

Use Node.js 22 or newer as the runtime and strict TypeScript compiled as native ESM. Use the built-in `node:test` runner through `tsx` for TypeScript tests and `tsc` for both type checking and builds.

## Rationale

Node 22 provides a modern, stable server runtime with built-in test support and broad WebSocket-library compatibility. Strict TypeScript makes the protocol contract explicit to machine consumers while runtime validation remains the authority for untrusted input. Native ESM keeps package boundaries and future transport dependencies consistent.

## Rejected alternatives

*Added 2026-08-15 when this record was brought to the current ADR format. The
decision is unchanged.*

### A different stack chosen on this repository's own merits

Rejected. The requirements here — an asynchronous server runtime, WebSocket
support, explicit contracts — are met by several stacks. What is not met by several
stacks is consistency with the ten sibling repositories an agent moves between.

### CommonJS, for broader library compatibility

Rejected. Native ESM keeps package boundaries and future transport dependencies
consistent with the rest of the ecosystem, and the compatibility gap has closed.

### A schema library for protocol validation instead of hand-written validators

Rejected for the foundation. Runtime validation is the authority for untrusted
input and must produce machine-readable errors in this repository's own error
shape; a schema library's error format would either leak into the protocol or need
translating anyway.

## Consequences

Runtime modules must use ESM-compatible imports and include file extensions where required by NodeNext resolution. Tests and builds are fully local and need no hardware or external service.

## Enforced in

- `package.json`
- `tsconfig.json`

## Explicit non-decisions

This ADR does not choose a WebSocket library, does not commit the protocol to
WebSocket as a permanent transport, and does not decide the runtime floor for any
sibling repository.

