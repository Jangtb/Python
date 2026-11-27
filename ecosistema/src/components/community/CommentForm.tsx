"use client";

import { useEffect, useRef } from "react";
import { addCommentAction } from "@/server/actions/community";
import { AntiSpamFields, Field, FormStatus, SubmitButton } from "@/components/forms/fields";
import { useTrackedAction } from "@/components/forms/useTrackedAction";

export function CommentForm({ threadId, path, label = "Tu respuesta" }: { threadId: string; path: string; label?: string }) {
  const [state, action] = useTrackedAction(addCommentAction, "Comentario publicado");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.at, state.status]);
  return (
    <form ref={formRef} action={action} className="form" noValidate>
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="path" value={path} />
      <AntiSpamFields />
      <Field id="comment-body" label={label} error={state.fieldErrors?.body} hint="Sé concreto y aporta contexto. Puedes usar saltos de línea.">
        {(aria) => <textarea {...aria} name="body" className="textarea" rows={5} required maxLength={4000} defaultValue={state.status === "error" ? (state.values?.body ?? "") : ""} />}
      </Field>
      <div className="cluster">
        <SubmitButton pendingLabel="Publicando…">Publicar respuesta</SubmitButton>
      </div>
      <FormStatus state={state} />
    </form>
  );
}
