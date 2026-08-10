# ADR 0001: TypeScript on Node.js 22

## Status

Accepted.

## Decision

Use Node.js 22 or newer as the runtime and strict TypeScript compiled as native ESM. Use the built-in `node:test` runner through `tsx` for TypeScript tests and `tsc` for both type checking and builds.

## Rationale

Node 22 provides a modern, stable server runtime with built-in test support and broad WebSocket-library compatibility. Strict TypeScript makes the protocol contract explicit to machine consumers while runtime validation remains the authority for untrusted input. Native ESM keeps package boundaries and future transport dependencies consistent.

## Consequences

Runtime modules must use ESM-compatible imports and include file extensions where required by NodeNext resolution. Tests and builds are fully local and need no hardware or external service.

