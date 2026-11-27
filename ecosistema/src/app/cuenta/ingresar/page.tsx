import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { LoginForm } from "@/components/forms/AuthForms";
import { getViewer, safeNext } from "@/server/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; aviso?: string }> }) {
  const { next, aviso } = await searchParams;
  const target = safeNext(next);
  if (await getViewer()) redirect(target);
  return (
    <AuthShell
      title="Ingresar"
      lead="Participa en la Comunidad de Datos: publica desafíos, responde y únete a eventos."
      footer={
        <>
          ¿Aún no tienes cuenta? <Link href={`/cuenta/registro?next=${encodeURIComponent(target)}`}>Crear una cuenta</Link>
        </>
      }
    >
      {aviso === "contrasena-actualizada" && <p className="alert alert--success">Contraseña actualizada. Ingresa con tu nueva contraseña.</p>}
      <LoginForm next={target} />
    </AuthShell>
  );
}
