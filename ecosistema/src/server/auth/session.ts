import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/config/env";
import { createSession, destroySession, viewerFromSessionToken, type Viewer } from "@/server/services/accounts";
import { isModerator } from "@/server/services/community";

export const SESSION_COOKIE = "dcd_session";

/** Usuario de la petición actual (memoizado por request). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const store = await cookies();
  return viewerFromSessionToken(store.get(SESSION_COOKIE)?.value);
});

export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  store.delete(SESSION_COOKIE);
}

/** Solo acepta rutas internas para evitar redirecciones abiertas. */
export function safeNext(next: string | null | undefined, fallback = "/comunidad"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export async function requireViewer(nextPath: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/cuenta/ingresar?next=${encodeURIComponent(safeNext(nextPath))}`);
  return viewer;
}

export async function requireModeratorPage(nextPath: string): Promise<Viewer> {
  const viewer = await requireViewer(nextPath);
  if (!isModerator(viewer)) redirect("/cuenta/perfil?aviso=sin-permisos");
  return viewer;
}

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function requireAdminPage(nextPath: string): Promise<Viewer> {
  const viewer = await requireModeratorPage(nextPath);
  if (viewer.user.role !== "admin") redirect("/admin");
  return viewer;
}
