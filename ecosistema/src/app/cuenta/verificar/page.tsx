import { AuthShell } from "@/components/layout/AuthShell";
import { TokenConfirmForm } from "@/components/forms/AuthForms";
import { verifyEmailAction } from "@/server/actions/auth";

export const metadata = { title: "Confirmar correo" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Confirma tu correo" lead="Un último paso para participar en la comunidad.">
      {token ? (
        <TokenConfirmForm token={token} action={verifyEmailAction} label="Confirmar mi correo" successLink={{ href: "/comunidad", label: "Ir a la comunidad" }} />
      ) : (
        <p className="alert alert--danger">El enlace está incompleto. Ábrelo nuevamente desde el correo.</p>
      )}
    </AuthShell>
  );
}
