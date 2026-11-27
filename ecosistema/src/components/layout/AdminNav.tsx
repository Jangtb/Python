"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/moderacion", label: "Moderación" },
    { href: "/admin/eventos", label: "Eventos" },
    ...(isAdmin
      ? [
          { href: "/admin/solicitudes", label: "Solicitudes" },
          { href: "/admin/miembros", label: "Miembros" },
        ]
      : []),
    { href: "/admin/contenido", label: "Contenido" },
  ];
  return (
    <nav className="admin-nav" aria-label="Administración">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
