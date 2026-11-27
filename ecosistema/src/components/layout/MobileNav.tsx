"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { navSections } from "@/config/navigation";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { Brandmark } from "./Brandmark";

/** Menú móvil sobre <dialog> nativo: gestiona foco, Escape y fondo inerte. */
export function MobileNav() {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <>
      <button type="button" className="menu-button" aria-label="Abrir menú" aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        <MenuIcon size={20} />
      </button>
      <dialog ref={ref} className="mobile-nav" aria-label="Menú principal">
        <div className="container mobile-nav__head">
          <Brandmark />
          <button type="button" className="menu-button" aria-label="Cerrar menú" onClick={() => ref.current?.close()}>
            <CloseIcon size={20} />
          </button>
        </div>
        <nav className="container mobile-nav__body" aria-label="Principal">
          {navSections.map((s) => (
            <div key={s.brand} className="mobile-nav__group" data-brand={s.brand}>
              <h2 className="eyebrow">{s.label}</h2>
              <ul role="list">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} onClick={() => ref.current?.close()}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mobile-nav__group">
            <h2 className="eyebrow">Ecosistema</h2>
            <ul role="list">
              <li>
                <Link href="/contacto" onClick={() => ref.current?.close()}>Contacto</Link>
              </li>
              <li>
                <Link href="/cuenta/perfil" onClick={() => ref.current?.close()}>Mi cuenta</Link>
              </li>
            </ul>
          </div>
        </nav>
      </dialog>
    </>
  );
}
