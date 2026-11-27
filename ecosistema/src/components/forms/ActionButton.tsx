"use client";

import { useActionState, type ReactNode } from "react";
import { idleState, type ActionState } from "@/lib/action-state";
import { SubmitButton } from "./fields";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Formulario de un solo botón para acciones puntuales (votar, moderar,
 * inscribirse…). Funciona sin JavaScript y muestra el resultado en línea.
 */
export function ActionButton({
  action,
  fields,
  children,
  pendingLabel = "Procesando…",
  className = "btn btn--sm btn--secondary",
  confirm,
  showSuccess = true,
}: {
  action: Action;
  fields: Record<string, string>;
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  confirm?: string;
  showSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form
      action={formAction}
      className="inline-form"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton className={className} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
      <span role="status" aria-live="polite" className="xsmall" style={{ marginLeft: "0.5rem" }}>
        {state.status === "error" && <span className="field__error">{state.message}</span>}
        {state.status === "success" && showSuccess && state.message && <span className="muted">{state.message}</span>}
      </span>
    </form>
  );
}
