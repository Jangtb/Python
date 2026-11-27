"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { antispam } from "@/config/site";
import type { ActionState } from "@/lib/action-state";

const HONEYPOT_FIELD = "website_url";
const STARTED_FIELD = "form_started";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (aria: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}

/** Envuelve un control con etiqueta, ayuda y error vinculados por aria-describedby. */
export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label} {optional && <span className="field__optional">(opcional)</span>}
      </label>
      {children({ id, ...(error ? { "aria-invalid": true as const } : {}), ...(describedBy ? { "aria-describedby": describedBy } : {}) })}
      {hint && (
        <span id={`${id}-hint`} className="field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field__error">
          {error}
        </span>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel = "Enviando…", className = "btn btn--accent" }: { children: ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Mensaje de resultado del formulario. Se anuncia a lectores de pantalla. */
export function FormStatus({ state, successTitle }: { state: ActionState; successTitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== "idle") ref.current?.focus();
  }, [state.at, state.status]);
  if (state.status === "idle" || !state.message) return <div role="status" aria-live="polite" />;
  const tone = state.status === "success" ? "alert--success" : "alert--danger";
  return (
    <div ref={ref} tabIndex={-1} role={state.status === "error" ? "alert" : "status"} className={`alert ${tone}`}>
      <div>
        {successTitle && state.status === "success" && <strong>{successTitle}</strong>}
        <span>{state.message}</span>
        {state.devLink && (
          <span style={{ display: "block", marginTop: "0.5rem" }}>
            <strong>Modo demostración:</strong> no hay proveedor de correo configurado. El enlace que llegaría por email es:{" "}
            <a href={state.devLink}>abrir enlace</a>
          </span>
        )}
      </div>
    </div>
  );
}

/** Honeypot + marca de tiempo + Turnstile (si está configurado). */
export function AntiSpamFields() {
  const [started, setStarted] = useState("");
  useEffect(() => setStarted(String(Date.now())), []);
  return (
    <>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={HONEYPOT_FIELD}>No completes este campo</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name={STARTED_FIELD} value={started} />
      {antispam.turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={antispam.turnstileSiteKey} data-language="es" />
        </>
      )}
    </>
  );
}

/** Valor previo (tras un error) o valor por defecto. */
export function valueOf(state: ActionState, name: string, fallback = ""): string {
  return state.values?.[name] ?? fallback;
}
