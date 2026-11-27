import "server-only";
import { integrations, serverEnv } from "@/config/env";
import { AppError } from "./errors";

/**
 * Controles antispam en capas:
 *  1. Honeypot (campo oculto que un humano no completa).
 *  2. Tiempo mínimo de llenado (los bots envían en milisegundos).
 *  3. Cloudflare Turnstile, si está configurado.
 *  4. Límites de frecuencia (en memoria para formularios públicos, persistentes
 *     en la base para acciones de miembros).
 *  5. Heurísticas de contenido (exceso de enlaces, texto repetido).
 */

export const HONEYPOT_FIELD = "website_url";
export const STARTED_FIELD = "form_started";
const MIN_FILL_MS = 2500;

export function assertHuman(form: Record<string, string>): void {
  if ((form[HONEYPOT_FIELD] ?? "").trim() !== "") {
    throw new AppError("spam", "No pudimos procesar el envío. Inténtalo nuevamente.");
  }
  const started = Number(form[STARTED_FIELD]);
  if (Number.isFinite(started) && started > 0 && Date.now() - started < MIN_FILL_MS) {
    throw new AppError("spam", "El formulario se envió demasiado rápido. Revisa los datos y vuelve a enviarlo.");
  }
}

export async function verifyTurnstile(form: Record<string, string>, ip: string | null): Promise<void> {
  if (!integrations.turnstile) return;
  const token = form["cf-turnstile-response"];
  if (!token) throw new AppError("spam", "Completa la verificación antispam.");
  const body = new URLSearchParams({ secret: serverEnv.turnstile.secretKey ?? "", response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json().catch(() => ({ success: false }))) as { success?: boolean };
  if (!data.success) throw new AppError("spam", "La verificación antispam falló. Inténtalo nuevamente.");
}

/* — Límite de frecuencia en memoria (por instancia) para formularios públicos — */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    throw new AppError("rate_limited", "Has realizado demasiados intentos. Espera unos minutos y vuelve a intentarlo.");
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}

export function __resetRateLimits(): void {
  buckets.clear();
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

export interface ContentAssessment {
  verdict: "ok" | "review" | "reject";
  reason?: string;
}

/** Evalúa texto publicado por miembros según su nivel de confianza. */
export function assessContent(text: string, trustLevel: 0 | 1): ContentAssessment {
  const links = countLinks(text);
  if (/(.)\1{14,}/.test(text)) return { verdict: "reject", reason: "El texto contiene caracteres repetidos en exceso." };
  if (links > 6) return { verdict: "reject", reason: "El texto contiene demasiados enlaces." };
  if (trustLevel === 0 && links > 2) return { verdict: "reject", reason: "Las cuentas nuevas pueden incluir hasta 2 enlaces por publicación." };
  if (trustLevel === 0 && links > 0) return { verdict: "review" };
  return { verdict: "ok" };
}
