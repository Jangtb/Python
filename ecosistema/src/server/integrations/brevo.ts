import "server-only";
import { serverEnv } from "@/config/env";

/**
 * Sincroniza un suscriptor ya confirmado con una lista de Brevo.
 * Brevo no envía su propio double opt-in aquí: la confirmación la gestiona el sitio.
 * Requiere BREVO_API_KEY y BREVO_LIST_ID. No verificado contra la API real en este repositorio.
 */
export async function syncConfirmedSubscriber(email: string): Promise<void> {
  const listId = Number(serverEnv.brevo.listId);
  if (!serverEnv.brevo.apiKey || !Number.isInteger(listId)) return;
  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": serverEnv.brevo.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Brevo respondió ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
}
