import "server-only";
import { randomUUID } from "node:crypto";
import { site } from "@/config/site";
import { serverEnv } from "@/config/env";
import { createToken, hashPassword, sha256, verifyPassword } from "@/server/auth/crypto";
import { AppError } from "@/server/errors";
import { devLinkIfLocal, sendEmail } from "@/server/integrations/email";
import { mutate, readDb } from "@/server/store/local-store";
import type { Database, Profile, TokenPurpose, User } from "@/server/store/types";

export const SESSION_TTL_MS = 30 * 86_400_000;
const VERIFY_TTL_MS = 48 * 3_600_000;
const RESET_TTL_MS = 60 * 60_000;

export interface Viewer {
  user: User;
  profile: Profile;
}

function issueToken(db: Database, purpose: TokenPurpose, subject: string, ttlMs: number): string {
  const token = createToken();
  const now = Date.now();
  // Invalida tokens anteriores del mismo propósito para este sujeto.
  for (const t of db.tokens) if (t.purpose === purpose && t.subject === subject && !t.usedAt) t.usedAt = new Date(now).toISOString();
  db.tokens.push({
    id: sha256(token),
    purpose,
    subject,
    expiresAt: new Date(now + ttlMs).toISOString(),
    usedAt: null,
    createdAt: new Date(now).toISOString(),
  });
  // Limpieza de tokens vencidos.
  db.tokens = db.tokens.filter((t) => Date.parse(t.expiresAt) > now - 7 * 86_400_000);
  return token;
}

function consumeToken(db: Database, purpose: TokenPurpose, token: string): string {
  const row = db.tokens.find((t) => t.id === sha256(token) && t.purpose === purpose);
  if (!row || row.usedAt || Date.parse(row.expiresAt) < Date.now()) {
    throw new AppError("validation", "El enlace no es válido o ya expiró. Solicita uno nuevo.");
  }
  row.usedAt = new Date().toISOString();
  return row.subject;
}

export interface RegisterInput {
  displayName: string;
  handle: string;
  email: string;
  password: string;
}

export async function registerAccount(input: RegisterInput): Promise<{ userId: string; devLink?: string }> {
  const passwordHash = await hashPassword(input.password);
  const { userId, token } = await mutate((db) => {
    if (db.users.some((u) => u.email === input.email)) {
      throw new AppError("conflict", "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.", {
        email: "Este correo ya está registrado.",
      });
    }
    if (db.profiles.some((p) => p.handle === input.handle)) {
      throw new AppError("conflict", "Ese nombre de usuario ya está en uso.", { handle: "Ese nombre de usuario ya está en uso." });
    }
    const now = new Date().toISOString();
    const id = randomUUID();
    const isAdmin = serverEnv.adminEmails.includes(input.email);
    db.users.push({
      id,
      email: input.email,
      passwordHash,
      role: isAdmin ? "admin" : "member",
      status: "active",
      emailVerifiedAt: null,
      trustLevel: isAdmin ? 1 : 0,
      createdAt: now,
    });
    db.profiles.push({
      userId: id,
      handle: input.handle,
      displayName: input.displayName,
      bio: "",
      specialty: "",
      interests: [],
      organization: null,
      links: [],
      updatedAt: now,
    });
    return { userId: id, token: issueToken(db, "verify_email", id, VERIFY_TTL_MS) };
  });

  const link = `${site.url}/cuenta/verificar?token=${encodeURIComponent(token)}`;
  const result = await sendEmail({
    to: input.email,
    subject: "Confirma tu correo · Comunidad de Datos",
    text: `Hola ${input.displayName}:\n\nPara activar tu participación en la Comunidad de Datos, confirma tu correo en este enlace (válido por 48 horas):\n\n${link}\n\nSi no creaste esta cuenta, ignora este mensaje.`,
  });
  return { userId, devLink: devLinkIfLocal(result, link) };
}

export async function resendVerification(userId: string): Promise<{ devLink?: string }> {
  const { email, name, token } = await mutate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new AppError("not_found", "Cuenta no encontrada.");
    if (user.emailVerifiedAt) throw new AppError("conflict", "Tu correo ya está verificado.");
    const recent = db.tokens.filter(
      (t) => t.subject === userId && t.purpose === "verify_email" && Date.now() - Date.parse(t.createdAt) < 3_600_000,
    );
    if (recent.length >= 3) throw new AppError("rate_limited", "Ya enviamos varios enlaces. Revisa tu bandeja o espera una hora.");
    const profile = db.profiles.find((p) => p.userId === userId);
    return { email: user.email, name: profile?.displayName ?? "", token: issueToken(db, "verify_email", userId, VERIFY_TTL_MS) };
  });
  const link = `${site.url}/cuenta/verificar?token=${encodeURIComponent(token)}`;
  const result = await sendEmail({
    to: email,
    subject: "Confirma tu correo · Comunidad de Datos",
    text: `Hola ${name}:\n\nEste es tu nuevo enlace para confirmar tu correo (válido por 48 horas):\n\n${link}`,
  });
  return { devLink: devLinkIfLocal(result, link) };
}

export async function verifyEmail(token: string): Promise<void> {
  await mutate((db) => {
    const userId = consumeToken(db, "verify_email", token);
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new AppError("not_found", "Cuenta no encontrada.");
    user.emailVerifiedAt ??= new Date().toISOString();
  });
}

export async function authenticate(email: string, password: string): Promise<User> {
  const db = await readDb();
  const user = db.users.find((u) => u.email === email);
  // Se verifica siempre una contraseña para no revelar por tiempo si el correo existe.
  const ok = await verifyPassword(password, user?.passwordHash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!user || !ok) throw new AppError("unauthenticated", "Correo o contraseña incorrectos.");
  if (user.status === "suspended") throw new AppError("forbidden", "Esta cuenta está suspendida. Escríbenos si crees que es un error.");
  return user;
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await mutate((db) => {
    const now = Date.now();
    db.sessions = db.sessions.filter((s) => Date.parse(s.expiresAt) > now);
    db.sessions.push({ id: sha256(token), userId, createdAt: new Date(now).toISOString(), expiresAt: expiresAt.toISOString() });
  });
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  const id = sha256(token);
  await mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.id !== id);
  });
}

export async function viewerFromSessionToken(token: string | undefined): Promise<Viewer | null> {
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions.find((s) => s.id === sha256(token));
  if (!session || Date.parse(session.expiresAt) < Date.now()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  const profile = db.profiles.find((p) => p.userId === session.userId);
  if (!user || !profile || user.status !== "active") return null;
  return { user, profile };
}

export async function requestPasswordReset(email: string): Promise<{ devLink?: string }> {
  const issued = await mutate((db) => {
    const user = db.users.find((u) => u.email === email && u.status === "active" && !u.passwordHash.startsWith("disabled:"));
    if (!user) return null;
    return { token: issueToken(db, "reset_password", user.id, RESET_TTL_MS), email: user.email };
  });
  // Respuesta idéntica exista o no la cuenta (evita enumeración de correos).
  if (!issued) return {};
  const link = `${site.url}/cuenta/restablecer?token=${encodeURIComponent(issued.token)}`;
  const result = await sendEmail({
    to: issued.email,
    subject: "Restablece tu contraseña · Datos con Datos",
    text: `Recibimos una solicitud para restablecer tu contraseña. Usa este enlace (válido por 60 minutos):\n\n${link}\n\nSi no fuiste tú, ignora este mensaje: tu contraseña no cambiará.`,
  });
  return { devLink: devLinkIfLocal(result, link) };
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await mutate((db) => {
    const userId = consumeToken(db, "reset_password", token);
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new AppError("not_found", "Cuenta no encontrada.");
    user.passwordHash = passwordHash;
    // Haber recibido el correo demuestra control de la casilla.
    user.emailVerifiedAt ??= new Date().toISOString();
    // Cierra todas las sesiones abiertas.
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
  });
}

export interface ProfileInput {
  displayName: string;
  bio: string;
  specialty: string;
  interests: string[];
  organization: string | null;
  linkedin?: string;
  website?: string;
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  await mutate((db) => {
    const profile = db.profiles.find((p) => p.userId === userId);
    if (!profile) throw new AppError("not_found", "Perfil no encontrado.");
    profile.displayName = input.displayName;
    profile.bio = input.bio;
    profile.specialty = input.specialty;
    profile.interests = input.interests;
    profile.organization = input.organization;
    profile.links = [
      ...(input.linkedin ? [{ label: "LinkedIn", url: input.linkedin }] : []),
      ...(input.website ? [{ label: "Sitio web", url: input.website }] : []),
    ];
    profile.updatedAt = new Date().toISOString();
  });
}
