/** Error de dominio con mensaje apto para mostrar al usuario. */
export class AppError extends Error {
  constructor(
    public readonly code:
      | "validation"
      | "unauthenticated"
      | "unverified"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "rate_limited"
      | "spam"
      | "unavailable",
    public readonly userMessage: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(userMessage);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
