# Architecture

## Purpose

The system provides a headless, machine-facing boundary between a central system and independently implemented devices. A device declares stable identity, metadata, capabilities, protocol version, and liveness; the central system addresses it only through the protocol contract.

## Boundaries

The device network owns protocol validation, device sessions, registry state, authentication, transport lifecycle, commands, events, and observability. It does not own a device's hardware implementation, a user interface, AI behavior, or domain-specific device features.

## Core model

- **Identity:** `device_id` is stable across reconnects; addresses and socket identifiers are not identity.
- **Session:** each successful registration receives an ephemeral session identity.
- **Registry:** device metadata, capability advertisements, liveness, and lifecycle state are queried independently of transport details.
- **Protocol:** all application messages share a versioned envelope and runtime validation.
- **Integration:** consumers receive typed lifecycle, event, and command-result notifications rather than WebSocket frames.

## Protocol foundation

Milestone 1 defines protocol version `1`, the common envelope, device registration identity and metadata, capability advertisements, heartbeats, commands, command results, and events. The parser validates all inbound values before any future transport or registry consumes them. Invalid messages return machine-readable errors and do not throw into the network boundary.

## Technology decision

The v0.1 runtime is Node.js 22 with strict TypeScript and ESM. WebSocket over TCP is the planned initial transport, but no transport is implemented in this foundation.
