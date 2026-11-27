import Link from "next/link";
import { integrations } from "@/config/env";

/** Aviso honesto del modo demostración: datos locales y contenido de ejemplo. */
export function DemoBanner() {
  const seeded = process.env.SEED_DEMO !== "false";
  if (!seeded && integrations.email) return null;
  return (
    <div className="demo-banner" role="note">
      <div className="container">
        <strong>Modo demostración.</strong>
        {seeded && <span>Las publicaciones, perfiles y eventos marcados como «Ejemplo» son ficticios.</span>}
        {!integrations.email && <span>Sin proveedor de correo: los enlaces de verificación se muestran en pantalla.</span>}
        <Link href="/comunidad/normas">Normas de la comunidad</Link>
      </div>
    </div>
  );
}
