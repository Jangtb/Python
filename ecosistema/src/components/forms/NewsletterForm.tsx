"use client";

import { newsletterAction } from "@/server/actions/leads";
import { AntiSpamFields, FormStatus, SubmitButton, valueOf } from "./fields";
import { useTrackedAction } from "./useTrackedAction";

export function NewsletterForm({ source, idPrefix = "nl" }: { source: string; idPrefix?: string }) {
  const [state, action] = useTrackedAction(newsletterAction, "Suscripción boletín", { source });
  const done = state.status === "success";
  return (
    <form action={action} className="newsletter__form" noValidate>
      <input type="hidden" name="source" value={source} />
      <AntiSpamFields />
      {!done && (
        <>
          <div className="newsletter__row">
            <label htmlFor={`${idPrefix}-email`} className="visually-hidden">
              Correo electrónico
            </label>
            <input
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="input"
              placeholder="tu@correo.com"
              defaultValue={valueOf(state, "email")}
              aria-invalid={state.fieldErrors?.email ? true : undefined}
              aria-describedby={state.fieldErrors?.email ? `${idPrefix}-email-error` : undefined}
              required
            />
            <SubmitButton className="btn btn--accent">Suscribirme</SubmitButton>
          </div>
          {state.fieldErrors?.email && (
            <span id={`${idPrefix}-email-error`} className="field__error">
              {state.fieldErrors.email}
            </span>
          )}
          <label className="check">
            <input type="checkbox" name="consent" required defaultChecked={state.values?.consent === "on"} />
            <span>
              Acepto recibir el boletín por correo. Puedo darme de baja cuando quiera desde cualquier envío.
            </span>
          </label>
          {state.fieldErrors?.consent && <span className="field__error">{state.fieldErrors.consent}</span>}
        </>
      )}
      {!state.fieldErrors && <FormStatus state={state} />}
    </form>
  );
}
