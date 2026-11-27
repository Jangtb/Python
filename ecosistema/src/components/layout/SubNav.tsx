"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavSection, type Brand } from "@/config/navigation";

/** Navegación secundaria de cada iniciativa. Marca la sección actual (incluye subrutas). */
export function SubNav({ brand }: { brand: Brand }) {
  const section = getNavSection(brand);
  const pathname = usePathname();
  const current = [...section.links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));

  return (
    <nav className="subnav" aria-label={`Secciones de ${section.label}`}>
      <div className="container subnav__inner">
        <Link href={section.href} className="subnav__title">
          <span className="subnav__swatch" aria-hidden="true" />
          {section.label}
        </Link>
        <ul role="list" className="subnav__links">
          {section.links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={current?.href === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
