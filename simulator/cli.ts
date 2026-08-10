#!/usr/bin/env node
import { DeviceSimulator } from "./client.js";

function values(argumentsList: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const key = argumentsList[index];
    const value = argumentsList[index + 1];
    if (key === undefined || value === undefined || !key.startsWith("--")) continue;
    (result[key.slice(2)] ??= []).push(value);
  }
  return result;
}

const options = values(process.argv.slice(2));
const required = (name: string): string => {
  const value = options[name]?.[0];
  if (value === undefined) throw new Error(`Missing --${name}`);
  return value;
};

try {
  const simulator = new DeviceSimulator({
    url: required("url"), device_id: required("id"), device_type: required("type"), credential: required("credential"),
    capabilities: options.capability ?? [], room: options.room?.[0], name: options.name?.[0], software_version: options["software-version"]?.[0],
  });
  await simulator.connect();
  process.stdout.write("simulator.online\n");
  const shutdown = async (): Promise<void> => { await simulator.disconnect(); process.exit(0); };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
