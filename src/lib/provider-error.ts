export type ProviderErrorCode =
  | "missing_api_key"
  | "auth_error"
  | "quota"
  | "timeout"
  | "blocked"
  | "no_image"
  | "api_error";

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly httpStatus: number = 502,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export const PROVIDER_TIMEOUT_MS = 120_000;

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ProviderError(
          "timeout",
          "The image generation request timed out. Please try again.",
          504,
        ),
      );
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function sanitizeProviderMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    const trimmed = error.message.trim().replace(/\s+/g, " ");
    return trimmed.length > 220 ? `${trimmed.slice(0, 220)}…` : trimmed;
  }
  return "Unknown provider error.";
}
