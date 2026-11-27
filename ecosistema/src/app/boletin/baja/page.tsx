import { AuthShell } from "@/components/layout/AuthShell";
import { TokenConfirmForm } from "@/components/forms/AuthForms";
import { unsubscribeAction } from "@/server/actions/leads";

export const metadata = { title: "Darse de baja", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Darse de baja del boletín" lead="Dejarás de recibir nuestros correos. Puedes volver a suscribirte cuando quieras.">
      {token ? <TokenConfirmForm token={token} action={unsubscribeAction} label="Confirmar baja" /> : <p className="alert alert--danger">Enlace incompleto.</p>}
    </AuthShell>
  );
}
