import { AuthShell } from "@/components/layout/AuthShell";
import { TokenConfirmForm } from "@/components/forms/AuthForms";
import { confirmSubscriptionAction } from "@/server/actions/leads";

export const metadata = { title: "Confirmar suscripción", robots: { index: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Confirma tu suscripción" lead="Haz clic para empezar a recibir el boletín de Datos con Datos.">
      {token ? (
        <TokenConfirmForm token={token} action={confirmSubscriptionAction} label="Confirmar suscripción" successLink={{ href: "/datos-con-datos", label: "Ir a Datos con Datos" }} />
      ) : (
        <p className="alert alert--danger">Enlace incompleto.</p>
      )}
    </AuthShell>
  );
}
