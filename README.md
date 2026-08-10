# Device Network

Headless, agent-oriented infrastructure for connecting devices to a central system through a stable, typed protocol.

This repository contains the network contract and its future development tooling. It does not implement physical-device behavior, a graphical interface, AI functionality, or an agent runtime.

## Runtime

- Node.js 22 or newer
- TypeScript in strict ESM mode

## Commands

```bash
npm install
npm run verify
```

`verify` runs type checking, automated tests, and a production build.

## Protocol foundation

Milestone 1 provides a versioned message envelope, typed registration/heartbeat/command/event contracts, and safe runtime parsing of untrusted input. See [Protocol v1](docs/protocol/v1.md) for the message contract.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Work plan](WORKPLAN.md)
- [Progress](PROGRESS.md)
- [Decision 0001](docs/decisions/0001-typescript-node-22.md)
