export type ProtocolErrorCode =
  | "INVALID_MESSAGE"
  | "UNSUPPORTED_PROTOCOL_VERSION"
  | "MESSAGE_TOO_LARGE"
  | "DEVICE_AUTH_FAILED"
  | "DEVICE_NOT_REGISTERED"
  | "SESSION_INVALID";

export type ProtocolError = {
  ok: false;
  error: {
    code: ProtocolErrorCode;
    message: string;
    context?: Record<string, string>;
  };
};

export function protocolError(
  code: ProtocolErrorCode,
  message: string,
  context?: Record<string, string>,
): ProtocolError {
  return {
    ok: false,
    error: context === undefined ? { code, message } : { code, message, context },
  };
}
