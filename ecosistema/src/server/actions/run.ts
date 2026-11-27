import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ZodType } from "zod";
import type { ActionState } from "@/lib/action-state";
import { AppError, isAppError } from "@/server/errors";
import { fieldErrors, formToObject } from "@/validation/schemas";

const SENSITIVE = /password|confirm|token/i;

function safeValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([k]) => !SENSITIVE.test(k)));
}

/**
 * Ejecuta una acción de formulario con manejo de errores centralizado:
 * - Errores de validación (Zod) → mensajes por campo.
 * - AppError → mensaje para el usuario.
 * - Cualquier otro error → se registra y se muestra un mensaje genérico.
 * Las redirecciones de Next (redirect/notFound) se relanzan.
 */
export async function runAction<T>(
  formData: FormData,
  schema: ZodType<T> | null,
  handler: (data: T, raw: Record<string, string>) => Promise<Partial<ActionState> | void>,
): Promise<ActionState> {
  const raw = formToObject(formData);
  try {
    let data = raw as unknown as T;
    if (schema) {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return {
          status: "error",
          message: "Revisa los campos marcados.",
          fieldErrors: fieldErrors(parsed.error),
          values: safeValues(raw),
          at: Date.now(),
        };
      }
      data = parsed.data;
    }
    const result = await handler(data, raw);
    return { status: "success", at: Date.now(), ...(result ?? {}) };
  } catch (error) {
    unstable_rethrow(error);
    if (isAppError(error)) {
      return { status: "error", message: error.userMessage, fieldErrors: error.fieldErrors, values: safeValues(raw), at: Date.now() };
    }
    console.error("[action] Error inesperado:", error);
    return {
      status: "error",
      message: "Ocurrió un error inesperado. Inténtalo nuevamente en unos minutos.",
      values: safeValues(raw),
      at: Date.now(),
    };
  }
}

export function fail(message: string): never {
  throw new AppError("validation", message);
}
