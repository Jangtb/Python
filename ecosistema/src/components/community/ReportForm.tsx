"use client";

import { useActionState } from "react";
import { reportReasons } from "@/content/community";
import { reportAction } from "@/server/actions/community";
import { idleState } from "@/lib/action-state";
import { FlagIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/forms/fields";

/** Reporte de contenido en un panel desplegable (<details>, accesible sin JS). */
export function ReportForm({ targetType, targetId, path }: { targetType: "thread" | "comment"; targetId: string; path: string }) {
  const [state, action] = useActionState(reportAction, idleState);
  if (state.status === "success") {
    return (
      <p role="status" className="xsmall muted">
        {state.message}
      </p>
    );
  }
  return (
    <details className="disclosure">
      <summary className="text-button cluster" style={{ ["--cluster-gap" as string]: "0.3rem", display: "inline-flex" }}>
        <FlagIcon size={13} /> Reportar
      </summary>
      <form action={action} className="panel stack" style={{ marginTop: "0.5rem", maxWidth: 420 }}>
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="path" value={path} />
        <fieldset className="stack stack--sm" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field__label">¿Por qué reportas este contenido?</legend>
          {reportReasons.map((r) => (
            <label key={r.value} className="check">
              <input type="radio" name="reason" value={r.value} required />
              <span>{r.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span className="field__label">
            Detalles <span className="field__optional">(opcional)</span>
          </span>
          <textarea name="details" className="textarea" rows={2} maxLength={500} style={{ minHeight: 70 }} />
        </label>
        {state.status === "error" && (
          <span className="field__error" role="alert">
            {state.fieldErrors?.reason ?? state.message}
          </span>
        )}
        <div>
          <SubmitButton className="btn btn--sm btn--secondary">Enviar reporte</SubmitButton>
        </div>
      </form>
    </details>
  );
}
