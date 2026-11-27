import Link from "next/link";
import { AuthShell } from "@/components/layout/AuthShell";
import { ResetRequestForm } from "@/components/forms/AuthForms";

export const metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <AuthShell title="Recuperar contraseña" lead="Te enviaremos un enlace válido por 60 minutos." footer={<Link href="/cuenta/ingresar">Volver a ingresar</Link>}>
      <ResetRequestForm />
    </AuthShell>
  );
}
