import "server-only";
import { randomUUID } from "node:crypto";
import { assessContent } from "@/server/antispam";
import { AppError } from "@/server/errors";
import { mutate, readDb } from "@/server/store/local-store";
import type {
  Comment,
  Database,
  Moderation,
  Profile,
  Report,
  ReportTarget,
  Thread,
  ThreadKind,
  ThreadStatus,
} from "@/server/store/types";
import type { Viewer } from "./accounts";

/* ============================ Permisos ============================ */

export function isModerator(viewer: Viewer | null): boolean {
  return viewer?.user.role === "moderator" || viewer?.user.role === "admin";
}

function requireParticipant(viewer: Viewer | null): Viewer {
  if (!viewer) throw new AppError("unauthenticated", "Inicia sesión para participar.");
  if (!viewer.user.emailVerifiedAt) {
    throw new AppError("unverified", "Confirma tu correo para participar. Revisa tu bandeja o solicita un nuevo enlace desde tu perfil.");
  }
  return viewer;
}

function requireModerator(viewer: Viewer | null): Viewer {
  if (!viewer || !isModerator(viewer)) throw new AppError("forbidden", "No tienes permisos para esta acción.");
  return viewer;
}

function canSeeThread(thread: Thread, viewer: Viewer | null): boolean {
  if (thread.moderation === "published") return true;
  if (!viewer) return false;
  return isModerator(viewer) || thread.authorId === viewer.user.id;
}

function canSeeComment(comment: Comment, viewer: Viewer | null): boolean {
  if (comment.moderation === "published") return true;
  if (!viewer) return false;
  return isModerator(viewer) || comment.authorId === viewer.user.id;
}

/* ============================ Vistas ============================ */

export interface AuthorSummary {
  handle: string;
  displayName: string;
  specialty: string;
}

export interface ThreadSummary {
  id: string;
  kind: ThreadKind;
  title: string;
  excerpt: string;
  categorySlug: string;
  tags: string[];
  proposalType: string | null;
  status: ThreadStatus;
  moderation: Moderation;
  author: AuthorSummary;
  createdAt: string;
  lastActivityAt: string;
  commentCount: number;
  voteCount: number;
  viewerVoted: boolean;
  hasSolution: boolean;
  isDemo: boolean;
}

export interface CommentView {
  id: string;
  body: string;
  author: AuthorSummary;
  authorId: string;
  createdAt: string;
  moderation: Moderation;
  isSolution: boolean;
  isDemo: boolean;
}

export interface ThreadDetail extends ThreadSummary {
  body: string;
  authorId: string;
  locked: boolean;
  solutionCommentId: string | null;
  comments: CommentView[];
  permissions: {
    canComment: boolean;
    canVote: boolean;
    canMarkSolution: boolean;
    canModerate: boolean;
    canChangeStatus: boolean;
  };
}

const unknownAuthor: AuthorSummary = { handle: "", displayName: "Miembro", specialty: "" };

function authorOf(db: Readonly<Database>, userId: string): AuthorSummary {
  const p = db.profiles.find((x) => x.userId === userId);
  return p ? { handle: p.handle, displayName: p.displayName, specialty: p.specialty } : unknownAuthor;
}

function excerpt(text: string, max = 220): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

function summarize(db: Readonly<Database>, t: Thread, viewer: Viewer | null): ThreadSummary {
  const comments = db.comments.filter((c) => c.threadId === t.id && c.moderation === "published");
  const votes = db.votes.filter((v) => v.threadId === t.id);
  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    excerpt: excerpt(t.body),
    categorySlug: t.categorySlug,
    tags: t.tags,
    proposalType: t.proposalType,
    status: t.status,
    moderation: t.moderation,
    author: authorOf(db, t.authorId),
    createdAt: t.createdAt,
    lastActivityAt: t.lastActivityAt,
    commentCount: comments.length,
    voteCount: votes.length,
    viewerVoted: viewer ? votes.some((v) => v.userId === viewer.user.id) : false,
    hasSolution: Boolean(t.solutionCommentId),
    isDemo: t.isDemo,
  };
}

/* ============================ Consultas ============================ */

export type ThreadSort = "recent" | "activity" | "top";

export interface ThreadQuery {
  kind: ThreadKind;
  category?: string;
  status?: ThreadStatus | "unanswered";
  tag?: string;
  q?: string;
  sort?: ThreadSort;
  limit?: number;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export async function listThreads(query: ThreadQuery, viewer: Viewer | null): Promise<ThreadSummary[]> {
  const db = await readDb();
  const needle = query.q ? normalize(query.q.trim()) : "";
  let rows = db.threads.filter((t) => t.kind === query.kind && t.moderation === "published");
  if (query.category) rows = rows.filter((t) => t.categorySlug === query.category);
  if (query.tag) rows = rows.filter((t) => t.tags.includes(query.tag!));
  if (query.status === "unanswered") {
    rows = rows.filter((t) => t.status !== "archived" && !db.comments.some((c) => c.threadId === t.id && c.moderation === "published"));
  } else if (query.status) {
    rows = rows.filter((t) => t.status === query.status);
  } else {
    rows = rows.filter((t) => t.status !== "archived");
  }
  if (needle) rows = rows.filter((t) => normalize(`${t.title} ${t.body} ${t.tags.join(" ")}`).includes(needle));

  const summaries = rows.map((t) => summarize(db, t, viewer));
  const sort = query.sort ?? (query.kind === "proposal" ? "top" : "activity");
  summaries.sort((a, b) => {
    if (sort === "top") return b.voteCount - a.voteCount || b.lastActivityAt.localeCompare(a.lastActivityAt);
    if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
    return b.lastActivityAt.localeCompare(a.lastActivityAt);
  });
  return query.limit ? summaries.slice(0, query.limit) : summaries;
}

/** Publicaciones propias que esperan revisión o fueron rechazadas (solo las ve su autor). */
export async function listOwnUnpublished(viewer: Viewer | null, kind: ThreadKind): Promise<ThreadSummary[]> {
  if (!viewer) return [];
  const db = await readDb();
  return db.threads
    .filter((t) => t.kind === kind && t.authorId === viewer.user.id && t.moderation !== "published")
    .map((t) => summarize(db, t, viewer));
}

export async function getThread(id: string, viewer: Viewer | null): Promise<ThreadDetail | null> {
  const db = await readDb();
  const t = db.threads.find((x) => x.id === id);
  if (!t || !canSeeThread(t, viewer)) return null;
  const moderator = isModerator(viewer);
  const isAuthor = viewer?.user.id === t.authorId;
  const verified = Boolean(viewer?.user.emailVerifiedAt);
  const open = t.moderation === "published" && !t.locked && t.status !== "archived";

  const comments: CommentView[] = db.comments
    .filter((c) => c.threadId === t.id && canSeeComment(c, viewer))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({
      id: c.id,
      body: c.body,
      author: authorOf(db, c.authorId),
      authorId: c.authorId,
      createdAt: c.createdAt,
      moderation: c.moderation,
      isSolution: c.id === t.solutionCommentId,
      isDemo: c.isDemo,
    }));

  return {
    ...summarize(db, t, viewer),
    body: t.body,
    authorId: t.authorId,
    locked: t.locked,
    solutionCommentId: t.solutionCommentId,
    comments,
    permissions: {
      canComment: Boolean(viewer) && open,
      canVote: verified && t.moderation === "published" && !isAuthor,
      canMarkSolution: t.kind === "discussion" && (isAuthor || moderator) && t.moderation === "published",
      canModerate: moderator,
      canChangeStatus: (isAuthor || moderator) && t.moderation === "published",
    },
  };
}

export async function categoryCounts(kind: ThreadKind): Promise<Record<string, number>> {
  const db = await readDb();
  const out: Record<string, number> = {};
  for (const t of db.threads) {
    if (t.kind !== kind || t.moderation !== "published" || t.status === "archived") continue;
    out[t.categorySlug] = (out[t.categorySlug] ?? 0) + 1;
  }
  return out;
}

export async function popularTags(limit = 10): Promise<{ tag: string; count: number }[]> {
  const db = await readDb();
  const counts = new Map<string, number>();
  for (const t of db.threads) {
    if (t.moderation !== "published") continue;
    for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export interface MemberSummary extends AuthorSummary {
  contributions: number;
}

export async function activeMembers(limit = 5): Promise<MemberSummary[]> {
  const db = await readDb();
  const since = Date.now() - 90 * 86_400_000;
  const counts = new Map<string, number>();
  const bump = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const t of db.threads) if (t.moderation === "published" && Date.parse(t.createdAt) > since) bump(t.authorId);
  for (const c of db.comments) if (c.moderation === "published" && Date.parse(c.createdAt) > since) bump(c.authorId);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId, contributions]) => ({ ...authorOf(db, userId), contributions }))
    .filter((m) => m.handle);
}

export interface PublicMember {
  profile: Omit<Profile, "userId">;
  joinedAt: string;
  isDemo: boolean;
  threads: ThreadSummary[];
  commentCount: number;
  solutionsCount: number;
}

export async function getMember(handle: string, viewer: Viewer | null): Promise<PublicMember | null> {
  const db = await readDb();
  const profile = db.profiles.find((p) => p.handle === handle);
  const user = profile && db.users.find((u) => u.id === profile.userId);
  if (!profile || !user || user.status !== "active") return null;
  const { userId, ...publicProfile } = profile;
  const comments = db.comments.filter((c) => c.authorId === userId && c.moderation === "published");
  return {
    profile: publicProfile,
    joinedAt: user.createdAt,
    isDemo: user.email.endsWith("@demo.invalid"),
    threads: db.threads
      .filter((t) => t.authorId === userId && t.moderation === "published")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => summarize(db, t, viewer)),
    commentCount: comments.length,
    solutionsCount: db.threads.filter((t) => t.solutionCommentId && comments.some((c) => c.id === t.solutionCommentId)).length,
  };
}

/* ============================ Escrituras ============================ */

function countRecent<T extends { createdAt: string }>(rows: readonly T[], pred: (r: T) => boolean, windowMs: number): number {
  const since = Date.now() - windowMs;
  return rows.filter((r) => pred(r) && Date.parse(r.createdAt) > since).length;
}

function audit(db: Database, actorId: string, action: string, targetType: string, targetId: string, note: string | null = null) {
  db.audit.push({ id: randomUUID(), actorId, action, targetType, targetId, note, createdAt: new Date().toISOString() });
}

export interface CreateThreadInput {
  title: string;
  body: string;
  categorySlug: string;
  tags: string[];
  proposalType?: string | null;
}

export async function createThread(
  viewerInput: Viewer | null,
  kind: ThreadKind,
  input: CreateThreadInput,
): Promise<{ id: string; moderation: Moderation }> {
  const viewer = requireParticipant(viewerInput);
  return mutate((db) => {
    const user = db.users.find((u) => u.id === viewer.user.id)!;
    const trusted = user.trustLevel === 1 || isModerator(viewer);
    const perHour = trusted ? 5 : 2;
    if (countRecent(db.threads, (t) => t.authorId === user.id, 3_600_000) >= perHour) {
      throw new AppError("rate_limited", `Puedes crear hasta ${perHour} publicaciones por hora. Inténtalo más tarde.`);
    }
    const sameTitle = normalize(input.title);
    if (db.threads.some((t) => t.authorId === user.id && normalize(t.title) === sameTitle && Date.now() - Date.parse(t.createdAt) < 86_400_000)) {
      throw new AppError("conflict", "Ya publicaste algo con ese mismo título hoy.", { title: "Título duplicado." });
    }
    const assessment = assessContent(`${input.title}\n${input.body}`, trusted ? 1 : 0);
    if (assessment.verdict === "reject") throw new AppError("spam", assessment.reason ?? "El contenido no cumple las normas.");
    const moderation: Moderation = trusted && assessment.verdict === "ok" ? "published" : "pending";
    const now = new Date().toISOString();
    const id = randomUUID();
    db.threads.push({
      id,
      kind,
      title: input.title,
      body: input.body,
      categorySlug: input.categorySlug,
      tags: input.tags,
      proposalType: kind === "proposal" ? (input.proposalType ?? null) : null,
      authorId: user.id,
      status: "open",
      moderation,
      solutionCommentId: null,
      locked: false,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    });
    return { id, moderation };
  });
}

export async function addComment(viewerInput: Viewer | null, threadId: string, body: string): Promise<{ id: string; moderation: Moderation }> {
  const viewer = requireParticipant(viewerInput);
  return mutate((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread || thread.moderation !== "published") throw new AppError("not_found", "La conversación no existe o no está disponible.");
    if (thread.locked || thread.status === "archived") throw new AppError("forbidden", "Esta conversación está cerrada a nuevos comentarios.");
    const user = db.users.find((u) => u.id === viewer.user.id)!;
    const trusted = user.trustLevel === 1 || isModerator(viewer);
    const perHour = trusted ? 20 : 8;
    if (countRecent(db.comments, (c) => c.authorId === user.id, 3_600_000) >= perHour) {
      throw new AppError("rate_limited", "Has comentado muchas veces en poco tiempo. Espera unos minutos.");
    }
    const assessment = assessContent(body, trusted ? 1 : 0);
    if (assessment.verdict === "reject") throw new AppError("spam", assessment.reason ?? "El comentario no cumple las normas.");
    const moderation: Moderation = assessment.verdict === "ok" ? "published" : "pending";
    const now = new Date().toISOString();
    const id = randomUUID();
    db.comments.push({ id, threadId, parentId: null, authorId: user.id, body, moderation, isDemo: false, createdAt: now });
    if (moderation === "published") {
      thread.lastActivityAt = now;
      if (thread.status === "open") thread.status = "discussion";
    }
    return { id, moderation };
  });
}

export async function toggleVote(viewerInput: Viewer | null, threadId: string): Promise<{ voted: boolean; count: number }> {
  const viewer = requireParticipant(viewerInput);
  return mutate((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread || thread.moderation !== "published") throw new AppError("not_found", "Publicación no disponible.");
    if (thread.authorId === viewer.user.id) throw new AppError("forbidden", "No puedes votar tu propia publicación.");
    const idx = db.votes.findIndex((v) => v.threadId === threadId && v.userId === viewer.user.id);
    if (idx >= 0) db.votes.splice(idx, 1);
    else db.votes.push({ threadId, userId: viewer.user.id, createdAt: new Date().toISOString() });
    return { voted: idx < 0, count: db.votes.filter((v) => v.threadId === threadId).length };
  });
}

export async function setSolution(viewerInput: Viewer | null, threadId: string, commentId: string | null): Promise<void> {
  const viewer = requireParticipant(viewerInput);
  await mutate((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread || thread.kind !== "discussion") throw new AppError("not_found", "Conversación no encontrada.");
    if (thread.authorId !== viewer.user.id && !isModerator(viewer)) {
      throw new AppError("forbidden", "Solo quien publicó la consulta o un moderador puede marcar la solución.");
    }
    if (commentId) {
      const comment = db.comments.find((c) => c.id === commentId && c.threadId === threadId && c.moderation === "published");
      if (!comment) throw new AppError("not_found", "Respuesta no encontrada.");
      thread.solutionCommentId = commentId;
      thread.status = "resolved";
    } else {
      thread.solutionCommentId = null;
      thread.status = db.comments.some((c) => c.threadId === threadId && c.moderation === "published") ? "discussion" : "open";
    }
    thread.updatedAt = new Date().toISOString();
    audit(db, viewer.user.id, commentId ? "solution.mark" : "solution.unmark", "thread", threadId);
  });
}

export async function changeThreadStatus(viewerInput: Viewer | null, threadId: string, status: ThreadStatus): Promise<void> {
  const viewer = requireParticipant(viewerInput);
  await mutate((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread) throw new AppError("not_found", "Publicación no encontrada.");
    const moderator = isModerator(viewer);
    const isAuthor = thread.authorId === viewer.user.id;
    if (!moderator && !(isAuthor && (status === "resolved" || status === "discussion" || status === "open"))) {
      throw new AppError("forbidden", "No tienes permisos para cambiar este estado.");
    }
    thread.status = status;
    if (status !== "resolved") thread.solutionCommentId = null;
    thread.updatedAt = new Date().toISOString();
    audit(db, viewer.user.id, `status.${status}`, "thread", threadId);
  });
}

export const AUTO_HIDE_REPORTS = 3;

export async function reportContent(
  viewerInput: Viewer | null,
  input: { targetType: ReportTarget; targetId: string; reason: Report["reason"]; details: string },
): Promise<{ autoHidden: boolean }> {
  const viewer = requireParticipant(viewerInput);
  return mutate((db) => {
    const target =
      input.targetType === "thread" ? db.threads.find((t) => t.id === input.targetId) : db.comments.find((c) => c.id === input.targetId);
    if (!target) throw new AppError("not_found", "Contenido no encontrado.");
    if (target.authorId === viewer.user.id) throw new AppError("forbidden", "No puedes reportar tu propio contenido.");
    if (db.reports.some((r) => r.targetId === input.targetId && r.reporterId === viewer.user.id && r.status === "open")) {
      throw new AppError("conflict", "Ya reportaste este contenido. El equipo de moderación lo revisará.");
    }
    if (countRecent(db.reports, (r) => r.reporterId === viewer.user.id, 3_600_000) >= 10) {
      throw new AppError("rate_limited", "Has enviado muchos reportes en poco tiempo.");
    }
    db.reports.push({
      id: randomUUID(),
      targetType: input.targetType,
      targetId: input.targetId,
      reporterId: viewer.user.id,
      reason: input.reason,
      details: input.details,
      status: "open",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    });
    const openReporters = new Set(db.reports.filter((r) => r.targetId === input.targetId && r.status === "open").map((r) => r.reporterId));
    const autoHidden = openReporters.size >= AUTO_HIDE_REPORTS && target.moderation === "published";
    if (autoHidden) {
      target.moderation = "hidden";
      audit(db, viewer.user.id, "auto_hide", input.targetType, input.targetId, `${openReporters.size} reportes`);
    }
    return { autoHidden };
  });
}

/* ============================ Moderación ============================ */

export type ModerationAction = "approve" | "reject" | "hide" | "restore" | "lock" | "unlock" | "archive";

export async function moderateThread(viewerInput: Viewer | null, threadId: string, action: ModerationAction, note: string | null = null): Promise<void> {
  const viewer = requireModerator(viewerInput);
  await mutate((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread) throw new AppError("not_found", "Publicación no encontrada.");
    switch (action) {
      case "approve":
      case "restore": {
        thread.moderation = "published";
        thread.lastActivityAt = new Date().toISOString();
        const author = db.users.find((u) => u.id === thread.authorId);
        // Una publicación aprobada convierte al autor en miembro de confianza.
        if (author && action === "approve") author.trustLevel = 1;
        break;
      }
      case "reject":
        thread.moderation = "rejected";
        break;
      case "hide":
        thread.moderation = "hidden";
        break;
      case "lock":
        thread.locked = true;
        break;
      case "unlock":
        thread.locked = false;
        break;
      case "archive":
        thread.status = "archived";
        break;
    }
    thread.updatedAt = new Date().toISOString();
    if (action === "approve" || action === "reject" || action === "hide" || action === "restore") resolveReportsFor(db, threadId, viewer.user.id);
    audit(db, viewer.user.id, `thread.${action}`, "thread", threadId, note);
  });
}

export async function moderateComment(viewerInput: Viewer | null, commentId: string, action: "approve" | "reject" | "hide" | "restore"): Promise<void> {
  const viewer = requireModerator(viewerInput);
  await mutate((db) => {
    const comment = db.comments.find((c) => c.id === commentId);
    if (!comment) throw new AppError("not_found", "Comentario no encontrado.");
    comment.moderation = action === "approve" || action === "restore" ? "published" : action === "reject" ? "rejected" : "hidden";
    const thread = db.threads.find((t) => t.id === comment.threadId);
    if (thread) {
      if (comment.moderation === "published") {
        thread.lastActivityAt = new Date().toISOString();
        if (thread.status === "open") thread.status = "discussion";
      } else if (thread.solutionCommentId === comment.id) {
        thread.solutionCommentId = null;
        thread.status = "discussion";
      }
    }
    if (action === "approve") {
      const author = db.users.find((u) => u.id === comment.authorId);
      if (author) author.trustLevel = 1;
    }
    resolveReportsFor(db, commentId, viewer.user.id);
    audit(db, viewer.user.id, `comment.${action}`, "comment", commentId);
  });
}

function resolveReportsFor(db: Database, targetId: string, moderatorId: string) {
  const now = new Date().toISOString();
  for (const r of db.reports) {
    if (r.targetId === targetId && r.status === "open") {
      r.status = "resolved";
      r.resolvedBy = moderatorId;
      r.resolvedAt = now;
    }
  }
}

export async function dismissReports(viewerInput: Viewer | null, targetId: string): Promise<void> {
  const viewer = requireModerator(viewerInput);
  await mutate((db) => {
    const now = new Date().toISOString();
    for (const r of db.reports) {
      if (r.targetId === targetId && r.status === "open") {
        r.status = "dismissed";
        r.resolvedBy = viewer.user.id;
        r.resolvedAt = now;
      }
    }
    audit(db, viewer.user.id, "reports.dismiss", "target", targetId);
  });
}

export interface QueueItem {
  targetType: ReportTarget;
  id: string;
  threadId: string;
  threadKind: ThreadKind;
  title: string;
  body: string;
  author: AuthorSummary;
  moderation: Moderation;
  createdAt: string;
  reports: { reason: Report["reason"]; details: string; createdAt: string }[];
}

export async function moderationQueue(viewerInput: Viewer | null): Promise<{ pending: QueueItem[]; reported: QueueItem[] }> {
  requireModerator(viewerInput);
  const db = await readDb();
  const reportsFor = (id: string) =>
    db.reports.filter((r) => r.targetId === id && r.status === "open").map((r) => ({ reason: r.reason, details: r.details, createdAt: r.createdAt }));

  const threadItem = (t: Thread): QueueItem => ({
    targetType: "thread",
    id: t.id,
    threadId: t.id,
    threadKind: t.kind,
    title: t.title,
    body: t.body,
    author: authorOf(db, t.authorId),
    moderation: t.moderation,
    createdAt: t.createdAt,
    reports: reportsFor(t.id),
  });
  const commentItem = (c: Comment): QueueItem => ({
    targetType: "comment",
    id: c.id,
    threadId: c.threadId,
    threadKind: db.threads.find((t) => t.id === c.threadId)?.kind ?? "discussion",
    title: `Comentario en «${db.threads.find((t) => t.id === c.threadId)?.title ?? "conversación"}»`,
    body: c.body,
    author: authorOf(db, c.authorId),
    moderation: c.moderation,
    createdAt: c.createdAt,
    reports: reportsFor(c.id),
  });

  const pending = [
    ...db.threads.filter((t) => t.moderation === "pending").map(threadItem),
    ...db.comments.filter((c) => c.moderation === "pending").map(commentItem),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const reportedIds = new Set(db.reports.filter((r) => r.status === "open").map((r) => r.targetId));
  const reported = [
    ...db.threads.filter((t) => reportedIds.has(t.id) && t.moderation !== "pending").map(threadItem),
    ...db.comments.filter((c) => reportedIds.has(c.id) && c.moderation !== "pending").map(commentItem),
  ].sort((a, b) => b.reports.length - a.reports.length);

  return { pending, reported };
}
