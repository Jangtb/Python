import "server-only";
import { randomUUID } from "node:crypto";
import { integrations, serverEnv } from "@/config/env";
import { site } from "@/config/site";
import { createToken, sha256 } from "@/server/auth/crypto";
import { AppError } from "@/server/errors";
import { devLinkIfLocal, sendEmail } from "@/server/integrations/email";
import { syncConfirmedSubscriber } from "@/server/integrations/brevo";
import { mutate, readDb } from "@/server/store/local-store";
import type { ContactRequest } from "@/server/store/types";
import { contactTypes } from "@/validation/schemas";
import type { Viewer } from "./accounts";
import { isModerator } from "./community";

/* ========================= Solicitudes de contacto ========================= */

export type ContactInput = Omit<ContactRequest, "id" | "status" | "createdAt">;

export async function createContactRequest(input: ContactInput): Promise<{ id: string }> {
  const id = randomUUID();
  await mutate((db) => {
    const dup = db.contactRequests.find(
      (r) => r.email === input.email && r.message === input.message && Date.now() - Date.parse(r.createdAt) < 86_400_000,
    );
    if (dup) throw new AppError("conflict", "Ya recibimos esta misma solicitud. Te responderemos a la brevedad.");
    db.contactRequests.push({ ...input, id, status: "new", createdAt: new Date().toISOString() });
  });

  const typeLabel = contactTypes.find((t) => t.value === input.type)?.label ?? input.type;
  // Notificación interna (si hay casilla configurada) y confirmación a quien escribe.
  const jobs: Promise<unknown>[] = [];
  if (serverEnv.email.contactInbox) {
    jobs.push(
      sendEmail({
        to: serverEnv.email.contactInbox,
        replyTo: input.email,
        subject: `Nueva solicitud: ${typeLabel} · ${input.name}`,
        text: [
          `Tipo: ${typeLabel}`,
          `Nombre: ${input.name}`,
          `Organización: ${input.organization ?? "—"}`,
          `Correo: ${input.email}`,
          `Preferencia de contacto: ${input.contactPreference}`,
          `Presupuesto estimado: ${input.budget ?? "—"}`,
          `Referencia: ${input.reference ?? "—"}`,
          "",
          input.message,
          "",
          `Gestionar: ${site.url}/admin/solicitudes`,
        ].join("\n"),
      }),
    );
  }
  jobs.push(
    sendEmail({
      to: input.email,
      subject: "Recibimos tu solicitud · Datos con Datos",
      text: `Hola ${input.name}:\n\nGracias por escribir. Recibimos tu solicitud de ${typeLabel.toLowerCase()} y la revisaremos personalmente. Normalmente respondemos dentro de dos días hábiles.\n\nResumen de lo que enviaste:\n\n${input.message}\n\n— Datos con Datos`,
    }),
  );
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[contacto] Falló un correo:", r.reason);
  return { id };
}

export async function listContactRequests(viewer: Viewer | null): Promise<ContactRequest[]> {
  if (viewer?.user.role !== "admin") throw new AppError("forbidden", "Solo administración puede ver las solicitudes.");
  const db = await readDb();
  return [...db.contactRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setContactStatus(viewer: Viewer | null, id: string, status: ContactRequest["status"]): Promise<void> {
  if (viewer?.user.role !== "admin") throw new AppError("forbidden", "Solo administración puede gestionar solicitudes.");
  await mutate((db) => {
    const r = db.contactRequests.find((x) => x.id === id);
    if (!r) throw new AppError("not_found", "Solicitud no encontrada.");
    r.status = status;
  });
}

/* ================================ Boletín ================================ */

export const NEWSLETTER_CONSENT =
  "Acepto recibir el boletín de Datos con Datos por correo. Puedo darme de baja en cualquier momento desde el enlace incluido en cada envío.";

/**
 * Doble confirmación (double opt-in) gestionada por el sitio: el correo queda
 * "pendiente" hasta que la persona confirma desde el enlace. Solo los
 * confirmados se sincronizan con Brevo, si está configurado.
 */
export async function subscribe(email: string, source: string): Promise<{ devLink?: string; already?: boolean }> {
  const confirmToken = createToken();
  const unsubscribeToken = createToken();
  const outcome = await mutate((db) => {
    const existing = db.subscribers.find((s) => s.email === email);
    if (existing?.status === "confirmed") return { already: true as const };
    const recent = db.tokens.filter((t) => t.purpose === "newsletter_confirm" && t.subject === existing?.id && Date.now() - Date.parse(t.createdAt) < 3_600_000);
    if (recent.length >= 3) throw new AppError("rate_limited", "Ya enviamos varios correos de confirmación. Revisa tu bandeja.");
    const now = new Date().toISOString();
    const id = existing?.id ?? randomUUID();
    if (existing) {
      existing.status = "pending";
      existing.consentText = NEWSLETTER_CONSENT;
      existing.consentAt = now;
      existing.unsubscribeTokenHash = sha256(unsubscribeToken);
      existing.unsubscribedAt = null;
      existing.source = source;
    } else {
      db.subscribers.push({
        id,
        email,
        status: "pending",
        unsubscribeTokenHash: sha256(unsubscribeToken),
        consentText: NEWSLETTER_CONSENT,
        consentAt: now,
        confirmedAt: null,
        unsubscribedAt: null,
        source,
      });
    }
    db.tokens.push({
      id: sha256(confirmToken),
      purpose: "newsletter_confirm",
      subject: id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      usedAt: null,
      createdAt: now,
    });
    return { already: false as const };
  });
  if (outcome.already) return { already: true };

  const confirmLink = `${site.url}/boletin/confirmar?token=${encodeURIComponent(confirmToken)}`;
  const unsubscribeLink = `${site.url}/boletin/baja?token=${encodeURIComponent(unsubscribeToken)}`;
  const result = await sendEmail({
    to: email,
    subject: "Confirma tu suscripción · Datos con Datos",
    text: `Para empezar a recibir el boletín de Datos con Datos, confirma tu suscripción:\n\n${confirmLink}\n\nSi no fuiste tú, ignora este mensaje y no recibirás nada.\n\nDarte de baja en cualquier momento: ${unsubscribeLink}`,
  });
  return { devLink: devLinkIfLocal(result, confirmLink) };
}

export async function confirmSubscription(token: string): Promise<{ email: string }> {
  const subscriber = await mutate((db) => {
    const row = db.tokens.find((t) => t.id === sha256(token) && t.purpose === "newsletter_confirm");
    if (!row || row.usedAt || Date.parse(row.expiresAt) < Date.now()) {
      throw new AppError("validation", "El enlace no es válido o expiró. Vuelve a suscribirte para recibir uno nuevo.");
    }
    row.usedAt = new Date().toISOString();
    const s = db.subscribers.find((x) => x.id === row.subject);
    if (!s) throw new AppError("not_found", "Suscripción no encontrada.");
    s.status = "confirmed";
    s.confirmedAt = new Date().toISOString();
    return { ...s };
  });
  if (integrations.brevo) {
    await syncConfirmedSubscriber(subscriber.email).catch((err) => console.error("[brevo] Sincronización fallida:", err));
  }
  return { email: subscriber.email };
}

export async function unsubscribe(token: string): Promise<void> {
  await mutate((db) => {
    const s = db.subscribers.find((x) => x.unsubscribeTokenHash === sha256(token));
    if (!s) throw new AppError("validation", "El enlace de baja no es válido.");
    s.status = "unsubscribed";
    s.unsubscribedAt = new Date().toISOString();
  });
}

/* ============================== Métricas admin ============================== */

export async function adminMetrics(viewer: Viewer | null) {
  if (!viewer || !isModerator(viewer)) throw new AppError("forbidden", "No tienes permisos.");
  const db = await readDb();
  const since30 = Date.now() - 30 * 86_400_000;
  const recent = <T extends { createdAt: string }>(rows: readonly T[]) => rows.filter((r) => Date.parse(r.createdAt) > since30).length;
  return {
    members: db.users.filter((u) => !u.email.endsWith("@demo.invalid")).length,
    newMembers30: recent(db.users.filter((u) => !u.email.endsWith("@demo.invalid"))),
    discussions: db.threads.filter((t) => t.kind === "discussion" && t.moderation === "published").length,
    proposals: db.threads.filter((t) => t.kind === "proposal" && t.moderation === "published").length,
    comments30: recent(db.comments),
    pending: db.threads.filter((t) => t.moderation === "pending").length + db.comments.filter((c) => c.moderation === "pending").length,
    openReports: db.reports.filter((r) => r.status === "open").length,
    newRequests: db.contactRequests.filter((r) => r.status === "new").length,
    requests30: recent(db.contactRequests),
    subscribers: db.subscribers.filter((s) => s.status === "confirmed").length,
    pendingSubscribers: db.subscribers.filter((s) => s.status === "pending").length,
    upcomingEvents: db.events.filter((e) => e.status === "published" && Date.parse(e.endsAt) > Date.now()).length,
    registrations: db.registrations.filter((r) => r.status === "confirmed").length,
    outbox: [...db.outbox].reverse().slice(0, 15),
    auditLog: [...db.audit].reverse().slice(0, 15),
  };
}

export async function listMembers(viewer: Viewer | null) {
  if (viewer?.user.role !== "admin") throw new AppError("forbidden", "Solo administración puede gestionar miembros.");
  const db = await readDb();
  return db.users
    .map((u) => {
      const p = db.profiles.find((x) => x.userId === u.id);
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        verified: Boolean(u.emailVerifiedAt),
        trustLevel: u.trustLevel,
        createdAt: u.createdAt,
        handle: p?.handle ?? "",
        displayName: p?.displayName ?? "",
        isDemo: u.email.endsWith("@demo.invalid"),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateMember(
  viewer: Viewer | null,
  userId: string,
  patch: { role?: "member" | "moderator" | "admin"; status?: "active" | "suspended" },
): Promise<void> {
  if (viewer?.user.role !== "admin") throw new AppError("forbidden", "Solo administración puede gestionar miembros.");
  if (userId === viewer.user.id) throw new AppError("forbidden", "No puedes cambiar tu propio rol o estado.");
  await mutate((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new AppError("not_found", "Miembro no encontrado.");
    if (patch.role) {
      u.role = patch.role;
      if (patch.role !== "member") u.trustLevel = 1;
    }
    if (patch.status) {
      u.status = patch.status;
      if (patch.status === "suspended") db.sessions = db.sessions.filter((s) => s.userId !== userId);
    }
    db.audit.push({
      id: randomUUID(),
      actorId: viewer.user.id,
      action: `member.${patch.role ? `role.${patch.role}` : `status.${patch.status}`}`,
      targetType: "user",
      targetId: userId,
      note: null,
      createdAt: new Date().toISOString(),
    });
  });
}
