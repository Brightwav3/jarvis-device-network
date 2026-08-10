# Protocol Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a versioned, runtime-validated, typed protocol contract for device registration, heartbeats, commands, results, and events.

**Architecture:** Protocol constants, error values, domain identity/capability values, TypeScript message types, and Zod validation remain small, independent modules. Validation is the only conversion from untrusted JSON to a typed message and returns structured failures instead of throwing protocol errors to callers.

**Tech Stack:** Node.js 22, strict TypeScript ESM, Zod 3, node:test with tsx.

## Global Constraints

- The protocol and runtime must remain headless and agent-oriented.
- No product-specific name belongs in a protocol value or runtime API.
- No WebSocket server, networking client, simulator, authentication behavior, or device-specific behavior is included.
- All incoming values are untrusted until runtime validation succeeds.
- Protocol version `1` is the sole supported version.

---

### Task 1: Protocol primitives and structured errors

**Files:**
- Create: `src/protocol/version.ts`
- Create: `src/protocol/errors.ts`
- Create: `tests/protocol/errors.test.ts`

**Interfaces:**
- Produces: `PROTOCOL_VERSION: "1"`, `ProtocolErrorCode`, `ProtocolError`, and `protocolError(code, message, context?)`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { protocolError } from "../../src/protocol/errors.js";

test("creates a machine-readable protocol error without optional context", () => {
  assert.deepEqual(protocolError("INVALID_MESSAGE", "Malformed message"), {
    ok: false,
    error: { code: "INVALID_MESSAGE", message: "Malformed message" },
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/protocol/errors.test.ts`
Expected: FAIL because `src/protocol/errors.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export const PROTOCOL_VERSION = "1" as const;

export type ProtocolErrorCode = "INVALID_MESSAGE" | "UNSUPPORTED_PROTOCOL_VERSION" | "MESSAGE_TOO_LARGE";
export type ProtocolError = { ok: false; error: { code: ProtocolErrorCode; message: string; context?: Record<string, string> } };

export function protocolError(code: ProtocolErrorCode, message: string, context?: Record<string, string>): ProtocolError {
  return { ok: false, error: context === undefined ? { code, message } : { code, message, context } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/protocol/errors.test.ts`
Expected: PASS.

### Task 2: Identity, capabilities, and typed messages

**Files:**
- Create: `src/devices/identity.ts`
- Create: `src/devices/capabilities.ts`
- Create: `src/protocol/messages.ts`
- Create: `tests/protocol/messages.test.ts`

**Interfaces:**
- Consumes: `PROTOCOL_VERSION` from `src/protocol/version.ts`.
- Produces: `DeviceIdentity`, `DeviceMetadata`, `Capability`, `DeviceMessageMap`, `DeviceMessage`, `MessageType`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import type { DeviceMessage } from "../../src/protocol/messages.js";

test("models a typed registration message", () => {
  const message: DeviceMessage<"device.register"> = {
    protocol_version: "1", type: "device.register", message_id: "m-1",
    timestamp: "2026-08-10T10:00:00.000Z",
    payload: { device_id: "bedroom-01", device_type: "room_satellite", capabilities: ["audio.input"] },
  };
  assert.equal(message.payload.device_id, "bedroom-01");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/protocol/messages.test.ts`
Expected: FAIL because `src/protocol/messages.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export type Capability = string;
export type DeviceIdentity = { device_id: string; device_type: string };
export type DeviceMetadata = { name?: string; room?: string; software_version?: string };
export type DeviceMessageMap = {
  "device.register": DeviceIdentity & DeviceMetadata & { capabilities: Capability[] };
  "device.heartbeat": Record<string, never>;
  "device.event": { event: string; payload: Record<string, unknown> };
  "command.request": { command_id: string; capability: Capability; operation: string; arguments: Record<string, unknown> };
  "command.result": { command_id: string; ok: boolean; result?: Record<string, unknown>; error?: { code: string; message: string } };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/protocol/messages.test.ts`
Expected: PASS.

### Task 3: Runtime validation

**Files:**
- Create: `src/protocol/validation.ts`
- Create: `tests/protocol/validation.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: typed messages, `PROTOCOL_VERSION`, and `protocolError`.
- Produces: `parseDeviceMessage(value: unknown, maxBytes?: number): ParseDeviceMessageResult`.

- [ ] **Step 1: Write the failing test**

```ts
test("rejects an unsupported protocol version explicitly", () => {
  const result = parseDeviceMessage({ protocol_version: "2", type: "device.heartbeat", message_id: "m-1", timestamp: "2026-08-10T10:00:00.000Z", payload: {} });
  assert.deepEqual(result, { ok: false, error: { code: "UNSUPPORTED_PROTOCOL_VERSION", message: "Unsupported protocol version", context: { protocol_version: "2" } } });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/protocol/validation.test.ts`
Expected: FAIL because `parseDeviceMessage` does not exist.

- [ ] **Step 3: Write minimal implementation**

Use Zod discriminated-union schemas for every `DeviceMessageMap` member. Enforce non-empty identifier fields, valid ISO timestamp strings, object payloads, the exact version `1`, and a configurable serialized-message byte limit. Convert every schema failure to `INVALID_MESSAGE`; distinguish unsupported versions before union parsing; never throw for invalid network input.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/protocol/validation.test.ts`
Expected: PASS for valid register and command messages; PASS for malformed payload, unknown type, oversized input, and unsupported version rejections.

### Task 4: Public API, documentation, and full verification

**Files:**
- Modify: `src/index.ts`
- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `PROGRESS.md`
- Create: `docs/protocol/v1.md`

**Interfaces:**
- Produces: package exports for all Milestone 1 protocol primitives.

- [ ] **Step 1: Write the failing import test**

```ts
import { parseDeviceMessage, PROTOCOL_VERSION } from "../../src/index.js";
test("exposes protocol validation through the package entry point", () => {
  assert.equal(PROTOCOL_VERSION, "1");
  assert.equal(parseDeviceMessage(validHeartbeat).ok, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/protocol/public-api.test.ts`
Expected: FAIL because the entry point does not export protocol values.

- [ ] **Step 3: Export and document the public API**

Export Milestone 1 modules from `src/index.ts`; add exact envelope and registration examples, compatibility policy, validation behavior, and error codes to `docs/protocol/v1.md`. Update progress with executed verification commands and mark Milestone 1 complete.

- [ ] **Step 4: Run full verification and commit**

Run: `npm run verify`
Expected: PASS for typecheck, all tests, and build.

Run:

```bash
git add src tests docs README.md ARCHITECTURE.md PROGRESS.md package.json package-lock.json
git commit -m "feat: add protocol foundation"
```
