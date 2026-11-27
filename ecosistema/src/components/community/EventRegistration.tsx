"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cancelRegistrationAction, registerEventAction } from "@/server/actions/community";
import { idleState } from "@/lib/action-state";
import { SubmitButton } from "@/components/forms/fields";

export function EventRegistration({
  eventId,
  registered,
  spotsLeft,
  isPast,
  cancelled,
  isLoggedIn,
  verified,
  path,
}: {
  eventId: string;
  registered: boolean;
  spotsLeft: number;
  isPast: boolean;
  cancelled: boolean;
  isLoggedIn: boolean;
  verified: boolean;
  path: string;
}) {
  const [regState, register] = useActionState(registerEventAction, idleState);
  const [cancelState, cancel] = useActionState(cancelRegistrationAction, idleState);
  const state = regState.at && (!cancelState.at || regState.at > cancelState.at) ? regState : cancelState;

  if (cancelled) return <p className="alert alert--danger">Este evento fue cancelado.</p>;
  if (isPast) return <p className="alert">Este evento ya finalizó.</p>;
  if (!isLoggedIn)
    return (
      <div className="stack stack--sm">
        <Link href={`/cuenta/ingresar?next=${encodeURIComponent(path)}`} className="btn btn--accent btn--block">
          Ingresa para inscribirte
        </Link>
        <Link href={`/cuenta/registro?next=${encodeURIComponent(path)}`} className="xsmall">
          ¿No tienes cuenta? Créala gratis
        </Link>
      </div>
    );
  if (!verified) return <p className="alert alert--warning">Confirma tu correo para inscribirte. Puedes reenviar el enlace desde tu perfil.</p>;

  return (
    <div className="stack stack--sm">
      {registered ? (
        <>
          <p className="alert alert--success">
            <span>
              <strong>Estás inscrito.</strong> Te enviamos los detalles por correo.
            </span>
          </p>
          <form action={cancel}>
            <input type="hidden" name="eventId" value={eventId} />
            <SubmitButton className="btn btn--secondary btn--block" pendingLabel="Cancelando…">
              Cancelar inscripción
            </SubmitButton>
          </form>
        </>
      ) : spotsLeft > 0 ? (
        <form action={register}>
          <input type="hidden" name="eventId" value={eventId} />
          <SubmitButton className="btn btn--accent btn--block" pendingLabel="Inscribiendo…">
            Inscribirme
          </SubmitButton>
        </form>
      ) : (
        <p className="alert">No quedan cupos disponibles.</p>
      )}
      <div role="status" aria-live="polite">
        {state.status === "error" && <span className="field__error">{state.message}</span>}
        {state.status === "success" && !registered && <span className="small muted">{state.message}</span>}
      </div>
    </div>
  );
}
