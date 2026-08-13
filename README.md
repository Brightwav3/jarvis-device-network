# Device Network

[![CI](https://github.com/Brightwav3/jarvis-device-network/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Brightwav3/jarvis-device-network/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Part of Assistant Mark I](https://img.shields.io/badge/Part%20of-Assistant%20Mark%20I-6f42c1)](https://github.com/Brightwav3/Assistant-mark-I)

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

## Software simulator

After building, start a simulated device against a running local server:

```bash
node dist/simulator/cli.js --url ws://127.0.0.1:8787 --id bedroom-01 --type room_satellite --credential local-secret --room bedroom --capability audio.input --capability audio.output
```

The simulator registers, sends heartbeats, returns successful simulated command results, and exits cleanly on `SIGINT` or `SIGTERM`.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Work plan](WORKPLAN.md)
- [Progress](PROGRESS.md)
- [Decision 0001](docs/decisions/0001-typescript-node-22.md)
