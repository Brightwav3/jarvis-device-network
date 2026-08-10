# Device Network Foundation Design

## Intent

Create an independently versioned, headless repository for machine-to-machine device communication. This change establishes only documentation and repeatable local verification; protocol implementation begins in Milestone 1.

## Repository shape

The repository contains `src/` and `tests/` as intentionally empty implementation roots, `docs/protocol/` for concrete message examples once the protocol exists, and decision records for durable implementation choices. No speculative source modules are created.

## Runtime and verification

The package uses Node.js 22+, strict TypeScript, native ESM, `node:test` through `tsx`, and `tsc`. `npm run verify` composes typecheck, tests, and build. Empty source roots are deliberate: the compiler is configured with an explicit empty file list until Milestone 1 introduces test-driven source files.

## Non-goals for this change

No transport server, networking client, simulator, device behavior, protocol types, authentication behavior, or product-specific runtime naming is included.

