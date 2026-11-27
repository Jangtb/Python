"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionInfo {
  displayName: string;
  handle: string;
  role: "member" | "moderator" | "admin";
  verified: boolean;
}

/**
 * Estado de sesión en el cliente: mantiene estáticas las páginas editoriales
 * (el layout raíz no lee cookies) y consulta /api/session tras la carga.
 */
export function AccountMenu() {
  const pathname = usePathname();
  const [state, setState] = useState<{ loaded: boolean; user: SessionInfo | null }>({ loaded: false, user: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data: { user: SessionInfo | null }) => !cancelled && setState({ loaded: true, user: data.user }))
      .catch(() => !cancelled && setState({ loaded: true, user: null }));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!state.loaded) return <span className="btn btn--sm btn--ghost btn--account" aria-hidden="true" style={{ minWidth: 96, visibility: "hidden" }} />;

  if (!state.user) {
    return (
      <Link href={`/cuenta/ingresar?next=${encodeURIComponent(pathname)}`} className="btn btn--sm btn--secondary btn--account">
        Ingresar
      </Link>
    );
  }

  const isStaff = state.user.role !== "member";
  return (
    <div className="cluster btn--account" style={{ ["--cluster-gap" as string]: "0.25rem" }}>
      {isStaff && (
        <Link href="/admin" className="btn btn--sm btn--ghost">
          Admin
        </Link>
      )}
      <Link href="/cuenta/perfil" className="btn btn--sm btn--secondary" aria-label={`Mi cuenta: ${state.user.displayName}`}>
        {state.user.displayName.split(" ")[0]}
        {!state.user.verified && <span className="badge badge--pending">Verificar</span>}
      </Link>
    </div>
  );
}
