import assert from "node:assert/strict";
import test from "node:test";
import { protocolError } from "../../src/protocol/errors.js";

test("creates a machine-readable protocol error without optional context", () => {
  assert.deepEqual(protocolError("INVALID_MESSAGE", "Malformed message"), {
    ok: false,
    error: { code: "INVALID_MESSAGE", message: "Malformed message" },
  });
});
