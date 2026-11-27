"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { assertHuman, rateLimit, verifyTurnstile } from "@/server/antispam";
import { clientIp, endSession, getViewer, safeNext, startSession } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import {
  authenticate,
  registerAccount,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyEmail,
} from "@/server/services/accounts";
import { loginSchema, profileSchema, registerSchema, resetPasswordSchema, resetRequestSchema } from "@/validation/schemas";
import { runAction } from "./run";

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, registerSchema, async (data, raw) => {
    assertHuman(raw);
    const ip = await clientIp();
    rateLimit(`register:${ip ?? "unknown"}`, 5, 60 * 60_000);
    await verifyTurnstile(raw, ip);
    const { userId, devLink } = await registerAccount(data);
    await startSession(userId);
    return {
      message: `Cuenta creada. Te enviamos un enlace a ${data.email} para confirmar tu correo: lo necesitas para publicar y comentar.`,
      devLink,
    };
  });
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let next = "/comunidad";
  const state = await runAction(formData, loginSchema, async (data, raw) => {
    const ip = await clientIp();
    rateLimit(`login:${ip ?? "unknown"}`, 20, 15 * 60_000);
    rateLimit(`login:${data.email}`, 8, 15 * 60_000);
    const user = await authenticate(data.email, data.password);
    await startSession(user.id);
    next = safeNext(raw.next);
  });
  if (state.status === "success") redirect(next);
  return state;
}

export async function logoutAction(): Promise<void> {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resendVerificationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async () => {
    const viewer = await getViewer();
    if (!viewer) throw new AppError("unauthenticated", "Inicia sesión nuevamente.");
    const { devLink } = await resendVerification(viewer.user.id);
    return { message: "Te enviamos un nuevo enlace de confirmación.", devLink };
  });
}

/** Se confirma con POST (botón) y no al abrir el enlace: los escáneres de correo no consumen el token. */
export async function verifyEmailAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_data, raw) => {
    if (!raw.token) throw new AppError("validation", "Enlace inválido.");
    await verifyEmail(raw.token);
    revalidatePath("/", "layout");
    return { message: "Tu correo quedó confirmado. Ya puedes participar en la comunidad." };
  });
}

export async function requestResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, resetRequestSchema, async (data, raw) => {
    assertHuman(raw);
    const ip = await clientIp();
    rateLimit(`reset:${ip ?? "unknown"}`, 5, 60 * 60_000);
    const { devLink } = await requestPasswordReset(data.email);
    return { message: "Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.", devLink };
  });
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(formData, resetPasswordSchema, async (data) => {
    await resetPassword(data.token, data.password);
  });
  if (state.status === "success") redirect("/cuenta/ingresar?aviso=contrasena-actualizada");
  return state;
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, profileSchema, async (data) => {
    const viewer = await getViewer();
    if (!viewer) throw new AppError("unauthenticated", "Tu sesión expiró. Inicia sesión nuevamente.");
    await updateProfile(viewer.user.id, data);
    revalidatePath(`/comunidad/miembros/${viewer.profile.handle}`);
    revalidatePath("/cuenta/perfil");
    return { message: "Perfil actualizado." };
  });
}
