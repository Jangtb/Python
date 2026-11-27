import Link from "next/link";
import { categoryName, proposalTypeName } from "@/content/community";
import { relativeTime } from "@/lib/dates";
import type { ThreadSummary } from "@/server/services/community";
import { CheckIcon, CommentIcon } from "@/components/ui/icons";
import { DemoBadge } from "@/components/ui/primitives";
import { ModerationBadge, StatusBadge } from "./StatusBadge";

export function threadHref(t: Pick<ThreadSummary, "kind" | "id">): string {
  return t.kind === "discussion" ? `/comunidad/discusiones/${t.id}` : `/comunidad/propuestas/${t.id}`;
}

export function ThreadRow({ thread, headingLevel = 3 }: { thread: ThreadSummary; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="thread-row">
      <div className="thread-row__score" aria-label={`${thread.voteCount} votos`}>
        <strong>{thread.voteCount}</strong>
        <span>{thread.kind === "proposal" ? "apoyos" : "útil"}</span>
      </div>
      <div>
        <Heading className="thread-row__title">
          <Link href={threadHref(thread)}>{thread.title}</Link>
        </Heading>
        <p className="thread-row__excerpt">{thread.excerpt}</p>
        <div className="thread-row__meta">
          {thread.kind === "discussion" ? <StatusBadge status={thread.status} /> : <span className="badge badge--accent">{proposalTypeName(thread.proposalType)}</span>}
          <ModerationBadge moderation={thread.moderation} />
          {thread.isDemo && <DemoBadge />}
          <Link href={`${thread.kind === "discussion" ? "/comunidad/discusiones" : "/comunidad/propuestas"}?categoria=${thread.categorySlug}`} className="tag">
            {categoryName(thread.categorySlug)}
          </Link>
          <span>
            {thread.author.displayName} · <time dateTime={thread.lastActivityAt}>{relativeTime(thread.lastActivityAt)}</time>
          </span>
          <span className="cluster" style={{ ["--cluster-gap" as string]: "0.3rem" }}>
            <CommentIcon size={14} /> {thread.commentCount}
          </span>
          {thread.hasSolution && (
            <span className="cluster" style={{ ["--cluster-gap" as string]: "0.3rem", color: "var(--c-success)" }}>
              <CheckIcon size={14} /> Con solución
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
