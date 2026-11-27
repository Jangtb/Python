import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "dcd-test-"));
process.env.DATA_DIR = dir;
process.env.SEED_DEMO = "false";
process.env.ADMIN_EMAILS = "admin@example.com";

const store = await import("@/server/store/local-store");
const accounts = await import("@/server/services/accounts");
const community = await import("@/server/services/community");
const events = await import("@/server/services/events");
const leads = await import("@/server/services/leads");
const crypto = await import("@/server/auth/crypto");
const antispam = await import("@/server/antispam");
const { zonedTimeToUtc } = await import("@/lib/dates");

type Viewer = Awaited<ReturnType<typeof accounts.viewerFromSessionToken>>;

let n = 0;
async function member(opts: { verified?: boolean; email?: string } = {}): Promise<NonNullable<Viewer>> {
  n += 1;
  const { userId } = await accounts.registerAccount({
    displayName: `Persona ${n}`,
    handle: `persona-${n}`,
    email: opts.email ?? `p${n}@example.com`,
    password: "una frase larga y segura",
  });
  if (opts.verified !== false) {
    await store.mutate((db) => {
      db.users.find((u) => u.id === userId)!.emailVerifiedAt = new Date().toISOString();
    });
  }
  const { token } = await accounts.createSession(userId);
  return (await accounts.viewerFromSessionToken(token))!;
}

const thread = { title: "¿Cómo priorizar reglas de calidad?", body: "Contexto suficiente para que la consulta tenga al menos treinta caracteres.", categorySlug: "data-quality", tags: [] };

beforeEach(() => {
  antispam.__resetRateLimits();
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("contraseñas y tokens", () => {
  it("verifica el hash scrypt y rechaza contraseñas incorrectas", async () => {
    const hash = await crypto.hashPassword("frase secreta larga");
    expect(await crypto.verifyPassword("frase secreta larga", hash)).toBe(true);
    expect(await crypto.verifyPassword("otra", hash)).toBe(false);
    expect(hash).not.toContain("frase");
  });

  it("autenticación genérica: no revela si el correo existe", async () => {
    await member({ email: "real@example.com" });
    await expect(accounts.authenticate("real@example.com", "mala")).rejects.toThrow("Correo o contraseña incorrectos.");
    await expect(accounts.authenticate("noexiste@example.com", "mala")).rejects.toThrow("Correo o contraseña incorrectos.");
  });

  it("el token de verificación es de un solo uso", async () => {
    const { userId } = await accounts.registerAccount({ displayName: "Token", handle: "token-user", email: "token@example.com", password: "una frase larga y segura" });
    const mail = (await store.readDb()).outbox.at(-1)!;
    const token = decodeURIComponent(mail.text.match(/token=([^\s]+)/)![1]!);
    await accounts.verifyEmail(token);
    expect((await store.readDb()).users.find((u) => u.id === userId)!.emailVerifiedAt).not.toBeNull();
    await expect(accounts.verifyEmail(token)).rejects.toThrow("no es válido");
  });

  it("restablecer contraseña cierra todas las sesiones", async () => {
    const v = await member({ email: "reset@example.com" });
    await accounts.requestPasswordReset("reset@example.com");
    const mail = (await store.readDb()).outbox.at(-1)!;
    const token = decodeURIComponent(mail.text.match(/token=([^\s]+)/)![1]!);
    await accounts.resetPassword(token, "nueva frase muy segura");
    expect((await store.readDb()).sessions.some((s) => s.userId === v.user.id)).toBe(false);
    await expect(accounts.authenticate("reset@example.com", "nueva frase muy segura")).resolves.toBeTruthy();
  });

  it("ADMIN_EMAILS asigna el rol de administración", async () => {
    const admin = await member({ email: "admin@example.com" });
    expect(admin.user.role).toBe("admin");
  });
});

describe("comunidad: publicación y moderación", () => {
  it("exige correo verificado para publicar", async () => {
    const v = await member({ verified: false });
    await expect(community.createThread(v, "discussion", thread)).rejects.toThrow("Confirma tu correo");
    await expect(community.createThread(null, "discussion", thread)).rejects.toThrow("Inicia sesión");
  });

  it("la primera publicación de una cuenta nueva queda pendiente e invisible para otros", async () => {
    const author = await member();
    const other = await member();
    const { id, moderation } = await community.createThread(author, "discussion", thread);
    expect(moderation).toBe("pending");
    expect(await community.getThread(id, null)).toBeNull();
    expect(await community.getThread(id, other)).toBeNull();
    expect(await community.getThread(id, author)).not.toBeNull();
  });

  it("aprobar publica y vuelve confiable al autor; miembros no pueden moderar", async () => {
    const author = await member();
    const mod = await member();
    await store.mutate((db) => {
      db.users.find((u) => u.id === mod.user.id)!.role = "moderator";
    });
    const modViewer = { ...mod, user: { ...mod.user, role: "moderator" as const } };
    const { id } = await community.createThread(author, "discussion", { ...thread, title: "Consulta para aprobar en pruebas" });
    await expect(community.moderateThread(author, id, "approve")).rejects.toThrow("permisos");
    await community.moderateThread(modViewer, id, "approve");
    expect((await community.getThread(id, null))?.moderation).toBe("published");
    const db = await store.readDb();
    expect(db.users.find((u) => u.id === author.user.id)!.trustLevel).toBe(1);
    expect(db.audit.some((a) => a.action === "thread.approve" && a.targetId === id)).toBe(true);
  });

  it("cuentas nuevas: más de 2 enlaces se rechaza; 1 enlace pasa a revisión", async () => {
    const v = await member();
    await expect(
      community.createThread(v, "discussion", { ...thread, body: `${thread.body} https://a.com https://b.com https://c.com` }),
    ).rejects.toThrow("hasta 2 enlaces");
    expect(antispam.assessContent("ver https://a.com", 0).verdict).toBe("review");
    expect(antispam.assessContent("ver https://a.com", 1).verdict).toBe("ok");
  });

  it("límite de publicaciones por hora", async () => {
    const v = await member();
    await community.createThread(v, "discussion", { ...thread, title: "Primera consulta de la hora" });
    await community.createThread(v, "discussion", { ...thread, title: "Segunda consulta de la hora" });
    await expect(community.createThread(v, "discussion", { ...thread, title: "Tercera consulta de la hora" })).rejects.toThrow("por hora");
  });

  it("comentario abre la discusión; solo autor/moderación marca la solución", async () => {
    const author = await member();
    await store.mutate((db) => {
      db.users.find((u) => u.id === author.user.id)!.trustLevel = 1;
    });
    const trusted = { ...author, user: { ...author.user, trustLevel: 1 as const } };
    const helper = await member();
    const { id } = await community.createThread(trusted, "discussion", { ...thread, title: "Consulta con solución" });
    const { id: commentId } = await community.addComment(helper, id, "Esta es una respuesta útil.");
    expect((await community.getThread(id, null))!.status).toBe("discussion");
    await expect(community.setSolution(helper, id, commentId)).rejects.toThrow("Solo quien publicó");
    await community.setSolution(trusted, id, commentId);
    const t = (await community.getThread(id, null))!;
    expect(t.status).toBe("resolved");
    expect(t.comments[0]!.isSolution).toBe(true);
  });

  it("votos: alterna y no permite votar lo propio", async () => {
    const author = await member();
    await store.mutate((db) => {
      db.users.find((u) => u.id === author.user.id)!.trustLevel = 1;
    });
    const { id } = await community.createThread({ ...author, user: { ...author.user, trustLevel: 1 } }, "proposal", { ...thread, title: "Propuesta votable", proposalType: "recurso" });
    const voter = await member();
    expect(await community.toggleVote(voter, id)).toEqual({ voted: true, count: 1 });
    expect(await community.toggleVote(voter, id)).toEqual({ voted: false, count: 0 });
    await expect(community.toggleVote(author, id)).rejects.toThrow("propia");
  });

  it(`${community.AUTO_HIDE_REPORTS} reportes distintos ocultan preventivamente`, async () => {
    const author = await member();
    await store.mutate((db) => {
      db.users.find((u) => u.id === author.user.id)!.trustLevel = 1;
    });
    const { id } = await community.createThread({ ...author, user: { ...author.user, trustLevel: 1 } }, "discussion", { ...thread, title: "Contenido que será reportado" });
    const reporters = [await member(), await member(), await member()];
    const r1 = await community.reportContent(reporters[0]!, { targetType: "thread", targetId: id, reason: "spam", details: "" });
    expect(r1.autoHidden).toBe(false);
    await expect(community.reportContent(reporters[0]!, { targetType: "thread", targetId: id, reason: "spam", details: "" })).rejects.toThrow("Ya reportaste");
    await community.reportContent(reporters[1]!, { targetType: "thread", targetId: id, reason: "spam", details: "" });
    const r3 = await community.reportContent(reporters[2]!, { targetType: "thread", targetId: id, reason: "abuso", details: "" });
    expect(r3.autoHidden).toBe(true);
    expect(await community.getThread(id, null)).toBeNull();
  });
});

describe("eventos", () => {
  it("respeta cupos y permite cancelar", async () => {
    const admin = (await accounts.viewerFromSessionToken((await accounts.createSession((await store.readDb()).users.find((u) => u.role === "admin")!.id)).token))!;
    const date = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const { slug } = await events.createEvent(admin, {
      title: "Evento con un cupo",
      summary: "Resumen suficientemente largo del evento.",
      description: "Descripción suficientemente larga del evento.",
      format: "charla",
      modality: "online",
      date,
      time: "19:00",
      durationMinutes: 60,
      timezone: "America/Santiago",
      location: null,
      organizer: "Comunidad",
      capacity: 1,
    });
    const e = (await events.getEvent(slug, null))!;
    const a = await member();
    const b = await member();
    await events.registerForEvent(a, e.id);
    await expect(events.registerForEvent(b, e.id)).rejects.toThrow("No quedan cupos");
    await events.cancelRegistration(a, e.id);
    await events.registerForEvent(b, e.id);
    expect((await events.getEvent(slug, b))!.viewerRegistered).toBe(true);
    await expect(events.createEvent(a, {} as Parameters<typeof events.createEvent>[1])).rejects.toThrow("moderación");
  });

  it("convierte hora local de una zona IANA a UTC", () => {
    expect(zonedTimeToUtc("2026-01-15", "19:00", "America/Santiago").toISOString()).toBe("2026-01-15T22:00:00.000Z");
    expect(zonedTimeToUtc("2026-07-15", "19:00", "America/Santiago").toISOString()).toBe("2026-07-15T23:00:00.000Z");
    expect(() => zonedTimeToUtc("2026-07-15", "19:00", "Mars/Base")).toThrow();
  });
});

describe("boletín y contacto", () => {
  it("doble confirmación y baja", async () => {
    await leads.subscribe("lector@example.com", "test");
    let db = await store.readDb();
    expect(db.subscribers.find((s) => s.email === "lector@example.com")!.status).toBe("pending");
    const text = db.outbox.at(-1)!.text;
    const confirm = decodeURIComponent(text.match(/confirmar\?token=([^\s]+)/)![1]!);
    const baja = decodeURIComponent(text.match(/baja\?token=([^\s]+)/)![1]!);
    await leads.confirmSubscription(confirm);
    expect((await leads.subscribe("lector@example.com", "test")).already).toBe(true);
    await leads.unsubscribe(baja);
    db = await store.readDb();
    expect(db.subscribers.find((s) => s.email === "lector@example.com")!.status).toBe("unsubscribed");
  });

  it("solicitudes: solo administración puede listarlas", async () => {
    await leads.createContactRequest({
      name: "Cliente",
      organization: null,
      email: "cliente@example.com",
      type: "diagnostico",
      message: "Necesitamos un diagnóstico de madurez.",
      budget: null,
      contactPreference: "correo",
      reference: null,
    });
    const m = await member();
    await expect(leads.listContactRequests(m)).rejects.toThrow("administración");
  });
});
