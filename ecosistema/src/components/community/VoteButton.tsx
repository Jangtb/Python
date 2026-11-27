"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { toggleVoteAction } from "@/server/actions/community";
import { idleState } from "@/lib/action-state";
import { UpIcon } from "@/components/ui/icons";

function Inner({ voted, count, label }: { voted: boolean; count: number; label: string }) {
  const { pending } = useFormStatus();
  // Respuesta optimista mientras se procesa.
  const shownVoted = pending ? !voted : voted;
  const shownCount = pending ? count + (voted ? -1 : 1) : count;
  return (
    <button type="submit" className="vote-button" aria-pressed={shownVoted} disabled={pending} aria-label={`${shownVoted ? "Quitar" : "Marcar"} ${label}. ${shownCount} en total`}>
      <UpIcon size={16} />
      <strong>{shownCount}</strong>
    </button>
  );
}

export function VoteButton({
  threadId,
  voted,
  count,
  canVote,
  isAuthor,
  isLoggedIn,
  path,
  label,
}: {
  threadId: string;
  voted: boolean;
  count: number;
  canVote: boolean;
  isAuthor: boolean;
  isLoggedIn: boolean;
  path: string;
  label: string;
}) {
  const [state, action] = useActionState(toggleVoteAction, idleState);
  if (!canVote) {
    return (
      <div className="stack stack--sm" style={{ alignItems: "center" }}>
        <span className="vote-button" aria-label={`${count} votos`} role="img">
          <UpIcon size={16} />
          <strong>{count}</strong>
        </span>
        {!isLoggedIn && (
          <Link href={`/cuenta/ingresar?next=${encodeURIComponent(path)}`} className="xsmall">
            Ingresa para votar
          </Link>
        )}
        {isLoggedIn && !isAuthor && <span className="xsmall muted">Verifica tu correo para votar</span>}
      </div>
    );
  }
  return (
    <form action={action} className="stack stack--sm" style={{ alignItems: "center" }}>
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="path" value={path} />
      <Inner voted={voted} count={count} label={label} />
      {state.status === "error" && (
        <span className="field__error" role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}
