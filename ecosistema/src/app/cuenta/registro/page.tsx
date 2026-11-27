import Link from "next/link";
import { AuthShell } from "@/components/layout/AuthShell";
import { RegisterForm } from "@/components/forms/AuthForms";
import { safeNext } from "@/server/auth/session";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  return (
    <AuthShell
      title="Únete a la Comunidad de Datos"
      lead="Es gratis. Confirmarás tu correo para poder publicar, comentar e inscribirte en eventos."
      footer={
        <>
          ¿Ya tienes cuenta? <Link href={`/cuenta/ingresar?next=${encodeURIComponent(target)}`}>Ingresar</Link>
        </>
      }
    >
      <RegisterForm next={target} />
    </AuthShell>
  );
}
