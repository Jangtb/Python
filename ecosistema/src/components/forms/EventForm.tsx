"use client";

import { useActionState } from "react";
import { site } from "@/config/site";
import { eventFormatLabels, eventModalityLabels } from "@/content/community";
import { idleState } from "@/lib/action-state";
import { createEventAction } from "@/server/actions/leads";
import { Field, FormStatus, SubmitButton, valueOf } from "./fields";

export function EventForm() {
  const [state, action] = useActionState(createEventAction, idleState);
  const e = state.fieldErrors ?? {};
  const keep = state.status === "error";
  const v = (k: string, d = "") => (keep ? valueOf(state, k, d) : d);
  return (
    <form action={action} className="form" key={state.status === "success" ? state.at : "form"} noValidate>
      <FormStatus state={state} />
      <Field id="ev-title" label="Nombre" error={e.title}>
        {(aria) => <input {...aria} name="title" className="input" required defaultValue={v("title")} />}
      </Field>
      <Field id="ev-summary" label="Resumen" hint="Una o dos frases para listados." error={e.summary}>
        {(aria) => <input {...aria} name="summary" className="input" required defaultValue={v("summary")} />}
      </Field>
      <Field id="ev-description" label="Descripción" error={e.description}>
        {(aria) => <textarea {...aria} name="description" className="textarea" rows={5} required defaultValue={v("description")} />}
      </Field>
      <div className="form__row form__row--2">
        <Field id="ev-format" label="Formato" error={e.format}>
          {(aria) => (
            <select {...aria} name="format" className="select" defaultValue={v("format", "charla")}>
              {Object.entries(eventFormatLabels).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="ev-modality" label="Modalidad" error={e.modality}>
          {(aria) => (
            <select {...aria} name="modality" className="select" defaultValue={v("modality", "online")}>
              {Object.entries(eventModalityLabels).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="form__row form__row--2">
        <Field id="ev-date" label="Fecha" error={e.date}>
          {(aria) => <input {...aria} name="date" type="date" className="input" required defaultValue={v("date")} />}
        </Field>
        <Field id="ev-time" label="Hora de inicio" error={e.time}>
          {(aria) => <input {...aria} name="time" type="time" className="input" required defaultValue={v("time", "19:00")} />}
        </Field>
      </div>
      <div className="form__row form__row--2">
        <Field id="ev-duration" label="Duración (minutos)" error={e.durationMinutes}>
          {(aria) => <input {...aria} name="durationMinutes" type="number" min={15} max={600} className="input" required defaultValue={v("durationMinutes", "90")} />}
        </Field>
        <Field id="ev-tz" label="Zona horaria (IANA)" error={e.timezone}>
          {(aria) => <input {...aria} name="timezone" className="input" required defaultValue={v("timezone", site.defaultTimezone)} />}
        </Field>
      </div>
      <div className="form__row form__row--2">
        <Field id="ev-location" label="Ubicación" optional hint="Obligatoria si es presencial o híbrida." error={e.location}>
          {(aria) => <input {...aria} name="location" className="input" defaultValue={v("location")} />}
        </Field>
        <Field id="ev-url" label="Enlace de conexión" optional hint="Solo visible para personas inscritas." error={e.onlineUrl}>
          {(aria) => <input {...aria} name="onlineUrl" type="url" className="input" defaultValue={v("onlineUrl")} />}
        </Field>
      </div>
      <div className="form__row form__row--2">
        <Field id="ev-organizer" label="Organiza" error={e.organizer}>
          {(aria) => <input {...aria} name="organizer" className="input" required defaultValue={v("organizer", "Comunidad de Datos")} />}
        </Field>
        <Field id="ev-capacity" label="Cupos" error={e.capacity}>
          {(aria) => <input {...aria} name="capacity" type="number" min={1} className="input" required defaultValue={v("capacity", "50")} />}
        </Field>
      </div>
      <div>
        <SubmitButton>Publicar evento</SubmitButton>
      </div>
    </form>
  );
}
