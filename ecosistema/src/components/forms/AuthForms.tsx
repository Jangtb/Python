"use client";

import Link from "next/link";
import { useActionState } from "react";
import { communityGuidelines } from "@/content/community";
import { idleState, type ActionState } from "@/lib/action-state";
import { loginAction, registerAction, requestResetAction, resetPasswordAction, updateProfileAction } from "@/server/actions/auth";
import { AntiSpamFields, Field, FormStatus, SubmitButton, valueOf } from "./fields";
import { useTrackedAction } from "./useTrackedAction";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, idleState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormStatus state={state} />
      <Field id="email" label="Correo" error={e.email}>
        {(aria) => <input {...aria} name="email" type="email" className="input" autoComplete="email" required defaultValue={valueOf(state, "email")} />}
      </Field>
      <Field id="password" label="Contraseña" error={e.password}>
        {(aria) => <input {...aria} name="password" type="password" className="input" autoComplete="current-password" required />}
      </Field>
      <SubmitButton className="btn btn--accent btn--block" pendingLabel="Ingresando…">
        Ingresar
      </SubmitButton>
      <p className="small muted" style={{ textAlign: "center" }}>
        <Link href="/cuenta/recuperar">¿Olvidaste tu contraseña?</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useTrackedAction(registerAction, "Registro");
  const e = state.fieldErrors ?? {};
  if (state.status === "success") {
    return (
      <div className="stack">
        <FormStatus state={state} successTitle="¡Bienvenida, bienvenido!" />
        <Link href={next} className="btn btn--accent">
          Continuar
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="form" noValidate>
      <AntiSpamFields />
      <FormStatus state={state} />
      <Field id="displayName" label="Nombre visible" hint="Así te verán en la comunidad." error={e.displayName}>
        {(aria) => <input {...aria} name="displayName" className="input" autoComplete="name" required defaultValue={valueOf(state, "displayName")} />}
      </Field>
      <Field id="handle" label="Nombre de usuario" hint="Minúsculas, números y guiones. Será parte de tu perfil: /miembros/tu-usuario" error={e.handle}>
        {(aria) => <input {...aria} name="handle" className="input" autoComplete="username" required pattern="[a-z0-9-]{3,30}" defaultValue={valueOf(state, "handle")} />}
      </Field>
      <Field id="email" label="Correo" hint="No se muestra públicamente." error={e.email}>
        {(aria) => <input {...aria} name="email" type="email" className="input" autoComplete="email" required defaultValue={valueOf(state, "email")} />}
      </Field>
      <Field id="password" label="Contraseña" hint="Mínimo 10 caracteres. Una frase larga es más segura y fácil de recordar." error={e.password}>
        {(aria) => <input {...aria} name="password" type="password" className="input" autoComplete="new-password" required minLength={10} />}
      </Field>
      <details className="disclosure panel">
        <summary className="field__label">Normas de la comunidad</summary>
        <ul className="check-list small muted" style={{ marginTop: "0.75rem" }}>
          {communityGuidelines.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </details>
      <label className="check">
        <input type="checkbox" name="acceptTerms" required aria-invalid={e.acceptTerms ? true : undefined} />
        <span>
          Acepto las <Link href="/comunidad/normas">normas de la comunidad</Link> y la <Link href="/privacidad">política de privacidad</Link>.
        </span>
      </label>
      {e.acceptTerms && <span className="field__error">{e.acceptTerms}</span>}
      <SubmitButton className="btn btn--accent btn--block" pendingLabel="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestResetAction, idleState);
  if (state.status === "success") return <FormStatus state={state} />;
  return (
    <form action={action} className="form" noValidate>
      <AntiSpamFields />
      <FormStatus state={state} />
      <Field id="email" label="Correo de tu cuenta" error={state.fieldErrors?.email}>
        {(aria) => <input {...aria} name="email" type="email" className="input" autoComplete="email" required defaultValue={valueOf(state, "email")} />}
      </Field>
      <SubmitButton className="btn btn--accent btn--block">Enviar enlace</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, idleState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormStatus state={state} />
      <Field id="password" label="Nueva contraseña" hint="Mínimo 10 caracteres." error={e.password}>
        {(aria) => <input {...aria} name="password" type="password" className="input" autoComplete="new-password" required minLength={10} />}
      </Field>
      <Field id="confirm" label="Repite la contraseña" error={e.confirm}>
        {(aria) => <input {...aria} name="confirm" type="password" className="input" autoComplete="new-password" required />}
      </Field>
      <SubmitButton className="btn btn--accent btn--block">Guardar contraseña</SubmitButton>
    </form>
  );
}

/** Confirmación explícita (POST) de un enlace recibido por correo. */
export function TokenConfirmForm({
  token,
  action,
  label,
  successLink,
}: {
  token: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  successLink?: { href: string; label: string };
}) {
  const [state, formAction] = useActionState(action, idleState);
  if (state.status === "success") {
    return (
      <div className="stack">
        <FormStatus state={state} />
        {successLink && (
          <Link href={successLink.href} className="btn btn--accent">
            {successLink.label}
          </Link>
        )}
      </div>
    );
  }
  return (
    <form action={formAction} className="form">
      <input type="hidden" name="token" value={token} />
      <FormStatus state={state} />
      <SubmitButton className="btn btn--accent btn--block">{label}</SubmitButton>
    </form>
  );
}

export interface ProfileDefaults {
  displayName: string;
  bio: string;
  specialty: string;
  interests: string;
  organization: string;
  linkedin: string;
  website: string;
}

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, action] = useActionState(updateProfileAction, idleState);
  const e = state.fieldErrors ?? {};
  const v = (k: keyof ProfileDefaults) => (state.status === "error" ? valueOf(state, k, defaults[k]) : defaults[k]);
  return (
    <form action={action} className="form" noValidate>
      <FormStatus state={state} />
      <div className="form__row form__row--2">
        <Field id="displayName" label="Nombre visible" error={e.displayName}>
          {(aria) => <input {...aria} name="displayName" className="input" required defaultValue={v("displayName")} />}
        </Field>
        <Field id="specialty" label="Especialidad" optional hint="Ej.: Arquitectura de datos" error={e.specialty}>
          {(aria) => <input {...aria} name="specialty" className="input" defaultValue={v("specialty")} />}
        </Field>
      </div>
      <Field id="bio" label="Biografía" optional hint="Hasta 600 caracteres." error={e.bio}>
        {(aria) => <textarea {...aria} name="bio" className="textarea" rows={4} maxLength={600} defaultValue={v("bio")} />}
      </Field>
      <div className="form__row form__row--2">
        <Field id="interests" label="Intereses" optional hint="Separados por coma (máx. 5)." error={e.interests}>
          {(aria) => <input {...aria} name="interests" className="input" defaultValue={v("interests")} />}
        </Field>
        <Field id="organization" label="Organización" optional hint="Solo si quieres mostrarla." error={e.organization}>
          {(aria) => <input {...aria} name="organization" className="input" defaultValue={v("organization")} />}
        </Field>
      </div>
      <div className="form__row form__row--2">
        <Field id="linkedin" label="LinkedIn" optional error={e.linkedin}>
          {(aria) => <input {...aria} name="linkedin" type="url" className="input" placeholder="https://www.linkedin.com/in/…" defaultValue={v("linkedin")} />}
        </Field>
        <Field id="website" label="Sitio web" optional error={e.website}>
          {(aria) => <input {...aria} name="website" type="url" className="input" placeholder="https://…" defaultValue={v("website")} />}
        </Field>
      </div>
      <div>
        <SubmitButton>Guardar perfil</SubmitButton>
      </div>
    </form>
  );
}
