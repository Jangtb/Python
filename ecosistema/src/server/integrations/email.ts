import "server-only";
import { randomUUID } from "node:crypto";
import { integrations, serverEnv } from "@/config/env";
import { mutate } from "@/server/store/local-store";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface EmailResult {
  delivered: "resend" | "local";
}

/**
 * Adaptador de correo.
 * - Con RESEND_API_KEY + EMAIL_FROM: envía vía API de Resend.
 * - Sin credenciales: registra el mensaje en la bandeja local (outbox) para
 *   poder revisarlo en /admin y en desarrollo. Nunca simula un envío real.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  let delivered: EmailResult["delivered"] = "local";

  if (integrations.email) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.email.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: serverEnv.email.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] Resend respondió ${response.status}: ${detail.slice(0, 300)}`);
      throw new Error("No fue posible enviar el correo.");
    }
    delivered = "resend";
  } else if (serverEnv.isProduction) {
    console.warn("[email] Proveedor de correo no configurado: el mensaje quedó solo en la bandeja local.");
  }

  await mutate((db) => {
    db.outbox.push({
      id: randomUUID(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      createdAt: new Date().toISOString(),
      delivered,
    });
    // La bandeja local conserva solo los últimos 200 mensajes.
    if (db.outbox.length > 200) db.outbox.splice(0, db.outbox.length - 200);
  });

  return { delivered };
}

/** Devuelve el enlace para mostrar en pantalla solo si no hay proveedor y estamos en modo demostración. */
export function devLinkIfLocal(result: EmailResult, link: string): string | undefined {
  return result.delivered === "local" && serverEnv.exposeDevLinks ? link : undefined;
}
