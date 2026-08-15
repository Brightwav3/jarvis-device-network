# Known Issues

- `PreSharedTokenAuthenticator` is the local-development implementation and must not
  become a production default. Authentication is isolated behind
  `DeviceAuthenticator` so a real implementation replaces it without a contract
  change.

- Heartbeat timeout is a tuning parameter with no safe default across deployments:
  too short expires live devices, too long keeps dead ones online.

- Atomic session replacement means a reconnect during in-flight work invalidates
  that work. A command result arriving on the prior session is refused. See
  [ADR 0002](docs/decisions/0002-identity-is-stable-sessions-are-not.md).

- No physical device implementation exists. `DeviceSimulator` is the only endpoint,
  and it is first-class for exactly that reason.

- WebSocket over TCP is the planned transport. Nothing commits the protocol to it.

- Device provisioning — how a `device_id` is assigned and trusted in the first place
  — is undecided.
