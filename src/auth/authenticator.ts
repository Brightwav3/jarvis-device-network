export type AuthenticationRequest = { device_id: string; credential: string };

export interface DeviceAuthenticator {
  authenticate(request: AuthenticationRequest): Promise<boolean>;
}

/** Local-development authenticator. Credentials are compared but never logged. */
export class PreSharedTokenAuthenticator implements DeviceAuthenticator {
  #credentials: Readonly<Record<string, string>>;

  constructor(credentials: Readonly<Record<string, string>>) {
    this.#credentials = { ...credentials };
  }

  async authenticate({ device_id, credential }: AuthenticationRequest): Promise<boolean> {
    return this.#credentials[device_id] === credential;
  }
}
