import "server-only";
import { randomUUID } from "node:crypto";
import { AppError } from "@/server/errors";
import { sendEmail } from "@/server/integrations/email";
import { mutate, readDb } from "@/server/store/local-store";
import type { CommunityEvent } from "@/server/store/types";
import { site } from "@/config/site";
import { slugify } from "@/lib/text";
import { zonedTimeToUtc, formatEventDate } from "@/lib/dates";
import type { Viewer } from "./accounts";
import { isModerator } from "./community";

export interface EventView extends CommunityEvent {
  registeredCount: number;
  spotsLeft: number;
  viewerRegistered: boolean;
  isPast: boolean;
}

function toView(e: CommunityEvent, regs: readonly { eventId: string; userId: string; status: string }[], viewer: Viewer | null): EventView {
  const confirmed = regs.filter((r) => r.eventId === e.id && r.status === "confirmed");
  return {
    ...e,
    registeredCount: confirmed.length,
    spotsLeft: Math.max(0, e.capacity - confirmed.length),
    viewerRegistered: viewer ? confirmed.some((r) => r.userId === viewer.user.id) : false,
    isPast: Date.parse(e.endsAt) < Date.now(),
  };
}

export async function listEvents(when: "upcoming" | "past", viewer: Viewer | null, limit?: number): Promise<EventView[]> {
  const db = await readDb();
  const now = Date.now();
  const rows = db.events
    .filter((e) => e.status !== "draft")
    .filter((e) => (when === "upcoming" ? Date.parse(e.endsAt) >= now : Date.parse(e.endsAt) < now))
    .sort((a, b) => (when === "upcoming" ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt)))
    .map((e) => toView(e, db.registrations, viewer));
  return limit ? rows.slice(0, limit) : rows;
}

export async function getEvent(slug: string, viewer: Viewer | null): Promise<EventView | null> {
  const db = await readDb();
  const e = db.events.find((x) => x.slug === slug && x.status !== "draft");
  return e ? toView(e, db.registrations, viewer) : null;
}

export async function registerForEvent(viewer: Viewer | null, eventId: string): Promise<void> {
  if (!viewer) throw new AppError("unauthenticated", "Inicia sesión para inscribirte.");
  if (!viewer.user.emailVerifiedAt) throw new AppError("unverified", "Confirma tu correo para inscribirte en eventos.");
  const event = await mutate((db) => {
    const e = db.events.find((x) => x.id === eventId);
    if (!e || e.status !== "published") throw new AppError("not_found", "El evento no está disponible.");
    if (Date.parse(e.startsAt) < Date.now()) throw new AppError("forbidden", "La inscripción para este evento ya cerró.");
    const existing = db.registrations.find((r) => r.eventId === eventId && r.userId === viewer.user.id);
    if (existing?.status === "confirmed") throw new AppError("conflict", "Ya estás inscrito en este evento.");
    const confirmed = db.registrations.filter((r) => r.eventId === eventId && r.status === "confirmed").length;
    if (confirmed >= e.capacity) throw new AppError("conflict", "No quedan cupos disponibles.");
    if (existing) {
      existing.status = "confirmed";
      existing.createdAt = new Date().toISOString();
    } else {
      db.registrations.push({ eventId, userId: viewer.user.id, status: "confirmed", createdAt: new Date().toISOString() });
    }
    return e;
  });
  const when = formatEventDate(event.startsAt, event.timezone);
  await sendEmail({
    to: viewer.user.email,
    subject: `Inscripción confirmada: ${event.title}`,
    text: `Hola ${viewer.profile.displayName}:\n\nTu inscripción a «${event.title}» quedó confirmada.\n\nFecha: ${when}\nModalidad: ${event.modality}\n${event.location ? `Lugar: ${event.location}\n` : ""}\nDetalles y calendario: ${site.url}/comunidad/eventos/${event.slug}\n\nSi no puedes asistir, cancela tu inscripción desde la página del evento para liberar el cupo.`,
  }).catch((err) => console.error("[events] No se pudo enviar la confirmación:", err));
}

export async function cancelRegistration(viewer: Viewer | null, eventId: string): Promise<void> {
  if (!viewer) throw new AppError("unauthenticated", "Inicia sesión para gestionar tu inscripción.");
  await mutate((db) => {
    const r = db.registrations.find((x) => x.eventId === eventId && x.userId === viewer.user.id && x.status === "confirmed");
    if (!r) throw new AppError("not_found", "No tienes una inscripción activa en este evento.");
    r.status = "cancelled";
  });
}

export interface EventInput {
  title: string;
  summary: string;
  description: string;
  format: CommunityEvent["format"];
  modality: CommunityEvent["modality"];
  date: string;
  time: string;
  durationMinutes: number;
  timezone: string;
  location: string | null;
  onlineUrl?: string;
  organizer: string;
  capacity: number;
}

export async function createEvent(viewer: Viewer | null, input: EventInput): Promise<{ slug: string }> {
  if (!viewer || !isModerator(viewer)) throw new AppError("forbidden", "Solo el equipo de moderación puede crear eventos.");
  if (input.modality !== "online" && !input.location) {
    throw new AppError("validation", "Indica la ubicación del evento.", { location: "Obligatorio para eventos presenciales o híbridos." });
  }
  let starts: Date;
  try {
    starts = zonedTimeToUtc(input.date, input.time, input.timezone);
  } catch {
    throw new AppError("validation", "La zona horaria no es válida.", { timezone: "Zona horaria no reconocida (usa formato IANA, p. ej. America/Santiago)." });
  }
  return mutate((db) => {
    let slug = slugify(input.title);
    if (db.events.some((e) => e.slug === slug)) slug = `${slug}-${input.date}`;
    if (db.events.some((e) => e.slug === slug)) slug = `${slug}-${randomUUID().slice(0, 4)}`;
    db.events.push({
      id: randomUUID(),
      slug,
      title: input.title,
      summary: input.summary,
      description: input.description,
      format: input.format,
      modality: input.modality,
      startsAt: starts.toISOString(),
      endsAt: new Date(starts.getTime() + input.durationMinutes * 60_000).toISOString(),
      timezone: input.timezone,
      location: input.location,
      onlineUrl: input.onlineUrl || null,
      organizer: input.organizer,
      capacity: input.capacity,
      status: "published",
      isDemo: false,
      createdBy: viewer.user.id,
      createdAt: new Date().toISOString(),
    });
    return { slug };
  });
}

export async function setEventStatus(viewer: Viewer | null, eventId: string, status: CommunityEvent["status"]): Promise<void> {
  if (!viewer || !isModerator(viewer)) throw new AppError("forbidden", "No tienes permisos para esta acción.");
  await mutate((db) => {
    const e = db.events.find((x) => x.id === eventId);
    if (!e) throw new AppError("not_found", "Evento no encontrado.");
    e.status = status;
  });
}

export async function eventRegistrants(viewer: Viewer | null, eventId: string): Promise<{ displayName: string; email: string; createdAt: string }[]> {
  if (!viewer || !isModerator(viewer)) throw new AppError("forbidden", "No tienes permisos para esta acción.");
  const db = await readDb();
  return db.registrations
    .filter((r) => r.eventId === eventId && r.status === "confirmed")
    .map((r) => {
      const u = db.users.find((x) => x.id === r.userId);
      const p = db.profiles.find((x) => x.userId === r.userId);
      return { displayName: p?.displayName ?? "—", email: u?.email ?? "—", createdAt: r.createdAt };
    });
}
