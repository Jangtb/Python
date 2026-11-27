"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { assertHuman } from "@/server/antispam";
import { getViewer } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import {
  addComment,
  changeThreadStatus,
  createThread,
  dismissReports,
  moderateComment,
  moderateThread,
  reportContent,
  setSolution,
  toggleVote,
  type ModerationAction,
} from "@/server/services/community";
import { cancelRegistration, registerForEvent } from "@/server/services/events";
import type { Report, ThreadStatus } from "@/server/store/types";
import { commentSchema, proposalSchema, reportSchema, threadSchema } from "@/validation/schemas";
import { runAction } from "./run";

const threadPath = (kind: "discussion" | "proposal", id: string) =>
  kind === "discussion" ? `/comunidad/discusiones/${id}` : `/comunidad/propuestas/${id}`;

function revalidateCommunity(path?: string) {
  revalidatePath("/comunidad", "layout");
  revalidatePath("/");
  if (path) revalidatePath(path);
}

export async function createDiscussionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let target = "";
  const state = await runAction(formData, threadSchema, async (data, raw) => {
    assertHuman(raw);
    const { id, moderation } = await createThread(await getViewer(), "discussion", data);
    target = `${threadPath("discussion", id)}${moderation === "pending" ? "?estado=en-revision" : "?estado=publicado"}`;
    revalidateCommunity();
  });
  if (state.status === "success" && target) redirect(target);
  return state;
}

export async function createProposalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let target = "";
  const state = await runAction(formData, proposalSchema, async (data, raw) => {
    assertHuman(raw);
    const { id, moderation } = await createThread(await getViewer(), "proposal", data);
    target = `${threadPath("proposal", id)}${moderation === "pending" ? "?estado=en-revision" : "?estado=publicado"}`;
    revalidateCommunity();
  });
  if (state.status === "success" && target) redirect(target);
  return state;
}

export async function addCommentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, commentSchema, async (data, raw) => {
    assertHuman(raw);
    const { moderation } = await addComment(await getViewer(), data.threadId, data.body);
    revalidateCommunity(raw.path);
    return {
      message:
        moderation === "pending"
          ? "Recibimos tu comentario. Como incluye enlaces y tu cuenta es nueva, se publicará tras una revisión rápida."
          : "Comentario publicado.",
    };
  });
}

export async function toggleVoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.threadId) throw new AppError("validation", "Publicación inválida.");
    await toggleVote(await getViewer(), raw.threadId);
    revalidateCommunity(raw.path);
  });
}

export async function setSolutionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.threadId) throw new AppError("validation", "Publicación inválida.");
    await setSolution(await getViewer(), raw.threadId, raw.commentId || null);
    revalidateCommunity(raw.path);
    return { message: raw.commentId ? "Respuesta marcada como solución." : "Solución desmarcada." };
  });
}

const statuses: ThreadStatus[] = ["open", "discussion", "resolved", "archived"];

export async function changeStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    const status = raw.status as ThreadStatus;
    if (!raw.threadId || !statuses.includes(status)) throw new AppError("validation", "Estado inválido.");
    await changeThreadStatus(await getViewer(), raw.threadId, status);
    revalidateCommunity(raw.path);
    return { message: "Estado actualizado." };
  });
}

export async function reportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, reportSchema, async (data, raw) => {
    const { autoHidden } = await reportContent(await getViewer(), { ...data, reason: data.reason as Report["reason"] });
    revalidateCommunity(raw.path);
    return {
      message: autoHidden
        ? "Gracias. El contenido quedó oculto de forma preventiva hasta que el equipo de moderación lo revise."
        : "Gracias por avisar. El equipo de moderación revisará el reporte.",
    };
  });
}

export async function registerEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.eventId) throw new AppError("validation", "Evento inválido.");
    await registerForEvent(await getViewer(), raw.eventId);
    revalidatePath("/comunidad/eventos", "layout");
    return { message: "¡Listo! Tu inscripción quedó confirmada. Te enviamos los detalles por correo." };
  });
}

export async function cancelRegistrationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.eventId) throw new AppError("validation", "Evento inválido.");
    await cancelRegistration(await getViewer(), raw.eventId);
    revalidatePath("/comunidad/eventos", "layout");
    return { message: "Cancelaste tu inscripción. El cupo quedó disponible para otra persona." };
  });
}

/* — Moderación — */

const threadActions: ModerationAction[] = ["approve", "reject", "hide", "restore", "lock", "unlock", "archive"];

export async function moderateThreadAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    const action = raw.action as ModerationAction;
    if (!raw.targetId || !threadActions.includes(action)) throw new AppError("validation", "Acción inválida.");
    await moderateThread(await getViewer(), raw.targetId, action, raw.note || null);
    revalidateCommunity(raw.path);
    revalidatePath("/admin", "layout");
    return { message: "Acción de moderación aplicada." };
  });
}

export async function moderateCommentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    const action = raw.action as "approve" | "reject" | "hide" | "restore";
    if (!raw.targetId || !["approve", "reject", "hide", "restore"].includes(action)) throw new AppError("validation", "Acción inválida.");
    await moderateComment(await getViewer(), raw.targetId, action);
    revalidateCommunity(raw.path);
    revalidatePath("/admin", "layout");
    return { message: "Acción de moderación aplicada." };
  });
}

export async function dismissReportsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, null, async (_d, raw) => {
    if (!raw.targetId) throw new AppError("validation", "Contenido inválido.");
    await dismissReports(await getViewer(), raw.targetId);
    revalidatePath("/admin", "layout");
    return { message: "Reportes descartados." };
  });
}
