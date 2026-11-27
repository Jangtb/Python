"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { assertHuman, rateLimit, verifyTurnstile } from "@/server/antispam";
import { clientIp, getViewer } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { createEvent, setEventStatus } from "@/server/services/events";
import {
  confirmSubscription,
  createContactRequest,
  setContactStatus,
  subscribe,
  unsubscribe,
  updateMember,
} from "@/server/services/leads";
import type { ContactRequest } from "@/server/store/types";
import { contactSchema, eventSchema, newsletterSchema } from "@/validation/schemas";
import { runAction } from "./run";

export async function contactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, contactSchema, async (data, raw) => {
    assertHuman(raw);
    const ip = await clientIp();
    rateLimit(`contact:${ip ?? "unknown"}`, 5, 60 * 60_000);
    await verifyTurnstile(raw, ip);
    await createContactRequest({
      ...data,
      type: data.type as ContactRequest["type"],
    });
    return {
      message: `Gracias, ${data.name.split(" ")[0]}. Recibimos tu solicitud y te enviamos una copia a ${data.email}. Te responderé personalmente, normalmente dentro de dos días hábiles.`,
    };
  });
}

export async function newsletterAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, newsletterSchema, async (data, raw) => {
    assertHuman(raw);
    const ip = await clientIp();
    rateLimit(`newsletter:${ip ?? "unknown"}`, 6, 60 * 60_000);
    const result = await subscribe(data.email, data.source);
    if (result.already) return { message: "Ese correo ya está suscrito. ¡Gracias por leernos!" };
    return { message: "Casi listo: te enviamos un correo para confirmar tu suscripción.", devLink: result.devLink };
  });
}

export async function confirmSubscriptionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.token) throw new AppError("validation", "Enlace inválido.");
    const { email } = await confirmSubscription(raw.token);
    return { message: `Suscripción confirmada para ${email}. Recibirás el próximo boletín.` };
  });
}

export async function unsubscribeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.token) throw new AppError("validation", "Enlace inválido.");
    await unsubscribe(raw.token);
    return { message: "Te diste de baja. No volverás a recibir el boletín." };
  });
}

/* — Administración — */

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, eventSchema, async (data) => {
    const { slug } = await createEvent(await getViewer(), data);
    revalidatePath("/comunidad", "layout");
    revalidatePath("/admin/eventos");
    return { message: `Evento publicado en /comunidad/eventos/${slug}.` };
  });
}

export async function setEventStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    const status = raw.status as "published" | "draft" | "cancelled";
    if (!raw.eventId || !["published", "draft", "cancelled"].includes(status)) throw new AppError("validation", "Acción inválida.");
    await setEventStatus(await getViewer(), raw.eventId, status);
    revalidatePath("/comunidad", "layout");
    revalidatePath("/admin/eventos");
    return { message: "Evento actualizado." };
  });
}

export async function setContactStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    const status = raw.status as ContactRequest["status"];
    if (!raw.id || !["new", "in_progress", "closed"].includes(status)) throw new AppError("validation", "Estado inválido.");
    await setContactStatus(await getViewer(), raw.id, status);
    revalidatePath("/admin/solicitudes");
    return { message: "Solicitud actualizada." };
  });
}

export async function updateMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.userId) throw new AppError("validation", "Miembro inválido.");
    const role = raw.role as "member" | "moderator" | "admin" | undefined;
    const status = raw.status as "active" | "suspended" | undefined;
    if (role && !["member", "moderator", "admin"].includes(role)) throw new AppError("validation", "Rol inválido.");
    if (status && !["active", "suspended"].includes(status)) throw new AppError("validation", "Estado inválido.");
    await updateMember(await getViewer(), raw.userId, { role: role || undefined, status: status || undefined });
    revalidatePath("/admin/miembros");
    return { message: "Miembro actualizado." };
  });
}
