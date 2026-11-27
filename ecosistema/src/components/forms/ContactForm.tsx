"use client";

import { contactAction } from "@/server/actions/leads";
import { contactTypes } from "@/validation/schemas";
import { AntiSpamFields, Field, FormStatus, SubmitButton, valueOf } from "./fields";
import { useTrackedAction } from "./useTrackedAction";

const preferences = [
  { value: "correo", label: "Correo" },
  { value: "videollamada", label: "Videollamada" },
  { value: "whatsapp", label: "WhatsApp" },
];

export function ContactForm({ defaultType, reference }: { defaultType?: string; reference?: string }) {
  const [state, action] = useTrackedAction(contactAction, "Solicitud de contacto", { tipo: defaultType ?? "general" });
  const e = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="stack">
        <FormStatus state={state} successTitle="Solicitud enviada" />
      </div>
    );
  }

  const type = valueOf(state, "type", contactTypes.some((t) => t.value === defaultType) ? defaultType : "");
  const pref = valueOf(state, "contactPreference", "correo");

  return (
    <form action={action} className="form" noValidate>
      <AntiSpamFields />
      <FormStatus state={state} />
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={e.type ? "type-error" : undefined}>
        <legend className="field__label" style={{ marginBottom: "var(--space-2)" }}>
          ¿Qué necesitas?
        </legend>
        <div className="radio-cards">
          {contactTypes.map((t) => (
            <label key={t.value} className="radio-card">
              <input type="radio" name="type" value={t.value} defaultChecked={type === t.value} required />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
        {e.type && (
          <span id="type-error" className="field__error">
            {e.type}
          </span>
        )}
      </fieldset>

      <div className="form__row form__row--2">
        <Field id="name" label="Nombre" error={e.name}>
          {(aria) => <input {...aria} name="name" className="input" autoComplete="name" required defaultValue={valueOf(state, "name")} />}
        </Field>
        <Field id="organization" label="Organización" optional error={e.organization}>
          {(aria) => <input {...aria} name="organization" className="input" autoComplete="organization" defaultValue={valueOf(state, "organization")} />}
        </Field>
      </div>
      <Field id="email" label="Correo" error={e.email}>
        {(aria) => <input {...aria} name="email" type="email" inputMode="email" className="input" autoComplete="email" required defaultValue={valueOf(state, "email")} />}
      </Field>
      <Field id="message" label="Describe el desafío" hint="Contexto, objetivo y plazos aproximados. Mientras más concreto, mejor será la respuesta." error={e.message}>
        {(aria) => <textarea {...aria} name="message" className="textarea" rows={7} required minLength={20} maxLength={4000} defaultValue={valueOf(state, "message")} />}
      </Field>
      <div className="form__row form__row--2">
        <Field id="budget" label="Presupuesto estimado" optional hint="Un rango aproximado ayuda a proponer un alcance realista." error={e.budget}>
          {(aria) => (
            <select {...aria} name="budget" className="select" defaultValue={valueOf(state, "budget")}>
              <option value="">Prefiero no indicarlo</option>
              <option>Por definir</option>
              <option>Menos de USD 2.000</option>
              <option>USD 2.000 – 10.000</option>
              <option>USD 10.000 – 30.000</option>
              <option>Más de USD 30.000</option>
            </select>
          )}
        </Field>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field__label" style={{ marginBottom: "var(--space-2)" }}>
            Preferencia de contacto
          </legend>
          <div className="radio-cards" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {preferences.map((p) => (
              <label key={p.value} className="radio-card">
                <input type="radio" name="contactPreference" value={p.value} defaultChecked={pref === p.value} />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      {reference && <input type="hidden" name="reference" value={reference.slice(0, 120)} />}
      <p className="xsmall muted">Usaremos tus datos solo para responder esta solicitud. No los compartimos con terceros.</p>
      <div>
        <SubmitButton pendingLabel="Enviando…">Enviar solicitud</SubmitButton>
      </div>
    </form>
  );
}
