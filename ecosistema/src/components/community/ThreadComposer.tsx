"use client";

import { communityCategories, communityGuidelines, proposalTypes } from "@/content/community";
import { createDiscussionAction, createProposalAction } from "@/server/actions/community";
import { AntiSpamFields, Field, FormStatus, SubmitButton, valueOf } from "@/components/forms/fields";
import { useTrackedAction } from "@/components/forms/useTrackedAction";

export function ThreadComposer({ kind }: { kind: "discussion" | "proposal" }) {
  const isProposal = kind === "proposal";
  const [state, action] = useTrackedAction(isProposal ? createProposalAction : createDiscussionAction, isProposal ? "Propuesta creada" : "Consulta creada");
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="form" noValidate>
      <AntiSpamFields />
      <FormStatus state={state} />
      <Field
        id="title"
        label={isProposal ? "Nombre de la propuesta" : "Título de tu consulta"}
        hint={isProposal ? "Ej.: Guía colaborativa de buenas prácticas de linaje" : "Formúlalo como pregunta concreta. Ej.: ¿Cómo priorizar reglas de calidad en un pipeline nuevo?"}
        error={e.title}
      >
        {(aria) => <input {...aria} name="title" className="input" required minLength={12} maxLength={160} defaultValue={valueOf(state, "title")} />}
      </Field>
      <div className="form__row form__row--2">
        <Field id="categorySlug" label="Categoría" error={e.categorySlug}>
          {(aria) => (
            <select {...aria} name="categorySlug" className="select" required defaultValue={valueOf(state, "categorySlug")}>
              <option value="" disabled>
                Selecciona…
              </option>
              {communityCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {isProposal ? (
          <Field id="proposalType" label="Tipo de propuesta" error={e.proposalType}>
            {(aria) => (
              <select {...aria} name="proposalType" className="select" required defaultValue={valueOf(state, "proposalType")}>
                <option value="" disabled>
                  Selecciona…
                </option>
                {proposalTypes.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <Field id="tags" label="Etiquetas" optional hint="Hasta 5, separadas por coma." error={e.tags}>
            {(aria) => <input {...aria} name="tags" className="input" defaultValue={valueOf(state, "tags")} placeholder="catálogo, roles, madurez" />}
          </Field>
        )}
      </div>
      {isProposal && (
        <Field id="tags" label="Etiquetas" optional hint="Hasta 5, separadas por coma." error={e.tags}>
          {(aria) => <input {...aria} name="tags" className="input" defaultValue={valueOf(state, "tags")} />}
        </Field>
      )}
      <Field
        id="body"
        label={isProposal ? "Describe la iniciativa" : "Describe el desafío"}
        hint={
          isProposal
            ? "¿Qué propones, para quién, qué se necesita y cómo podrían sumarse otras personas?"
            : "Contexto, qué intentaste y qué tipo de ayuda buscas. No incluyas datos confidenciales."
        }
        error={e.body}
      >
        {(aria) => <textarea {...aria} name="body" className="textarea" rows={9} required minLength={30} maxLength={8000} defaultValue={valueOf(state, "body")} />}
      </Field>
      <details className="disclosure panel">
        <summary className="field__label">Normas de la comunidad</summary>
        <ul className="check-list small muted" style={{ marginTop: "0.75rem" }}>
          {communityGuidelines.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </details>
      <div className="cluster">
        <SubmitButton pendingLabel="Publicando…">{isProposal ? "Publicar propuesta" : "Publicar consulta"}</SubmitButton>
        <span className="xsmall muted">Las primeras publicaciones de cuentas nuevas pasan por una revisión breve.</span>
      </div>
    </form>
  );
}
