import Link from "next/link";
import { AuthShell } from "@/components/layout/AuthShell";
import { ResetPasswordForm } from "@/components/forms/AuthForms";

export const metadata = { title: "Nueva contraseña" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Elige una nueva contraseña" lead="Al guardarla se cerrarán las sesiones abiertas en otros dispositivos.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="alert alert--danger">
          Enlace incompleto. <Link href="/cuenta/recuperar">Solicita uno nuevo</Link>.
        </p>
      )}
    </AuthShell>
  );
}
