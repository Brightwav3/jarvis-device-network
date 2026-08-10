import { randomUUID } from "node:crypto";

export type SessionId = string;

export function createSessionId(): SessionId {
  return randomUUID();
}
