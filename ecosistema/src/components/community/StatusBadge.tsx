import { threadStatusLabels } from "@/content/community";
import type { Moderation, ThreadStatus } from "@/server/store/types";

const statusClass: Record<ThreadStatus, string> = {
  open: "badge--open",
  discussion: "badge--discussion",
  resolved: "badge--resolved",
  archived: "badge--archived",
};

export function StatusBadge({ status }: { status: ThreadStatus }) {
  return <span className={`badge ${statusClass[status]}`}>{threadStatusLabels[status]}</span>;
}

export function ModerationBadge({ moderation }: { moderation: Moderation }) {
  if (moderation === "published") return null;
  const label = { pending: "En revisión", hidden: "Oculto", rejected: "Rechazado" }[moderation];
  return <span className={`badge ${moderation === "pending" ? "badge--pending" : "badge--danger"}`}>{label}</span>;
}
