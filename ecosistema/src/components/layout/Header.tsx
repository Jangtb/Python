"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navSections, type Brand } from "@/config/navigation";
import { ArrowRight, ChevronDown } from "@/components/ui/icons";
import { Brandmark } from "./Brandmark";
import { AccountMenu } from "./AccountMenu";
import { MobileNav } from "./MobileNav";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState<Brand | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<Brand, HTMLButtonElement | null>>>({});

  // Cierra el panel al navegar.
  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggers.current[open]?.focus();
        setOpen(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const active = navSections.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))?.brand;
  const section = navSections.find((s) => s.brand === open);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container site-header__inner">
        <Brandmark />
        <nav className="nav" aria-label="Principal">
          <ul role="list" className="nav__list">
            {navSections.map((s) => (
              <li key={s.brand}>
                <button
                  type="button"
                  ref={(el) => {
                    triggers.current[s.brand] = el;
                  }}
                  className="nav__trigger"
                  aria-expanded={open === s.brand}
                  aria-controls={`mega-${s.brand}`}
                  data-active={active === s.brand}
                  onClick={() => setOpen((cur) => (cur === s.brand ? null : s.brand))}
                >
                  {s.label}
                  <ChevronDown className="nav__chevron" size={10} />
                </button>
              </li>
            ))}
            <li>
              <Link href="/contacto" className="nav__link" aria-current={pathname === "/contacto" ? "page" : undefined}>
                Contacto
              </Link>
            </li>
          </ul>
        </nav>
        <div className="header-actions">
          <AccountMenu />
          <MobileNav />
        </div>
      </div>

      {section && (
        <div className="megapanel" id={`mega-${section.brand}`} data-brand={section.brand}>
          <div className="container megapanel__grid">
            <div className="megapanel__intro stack">
              <span className="eyebrow">{section.verb}</span>
              <p className="h3">{section.label}</p>
              <p className="muted small">{section.summary}</p>
              <Link href={section.href} className="link-arrow">
                Ir a {section.label} <span aria-hidden="true"><ArrowRight size={14} /></span>
              </Link>
            </div>
            <ul role="list" className="megapanel__links">
              {section.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="megapanel__link" aria-current={pathname === l.href ? "page" : undefined}>
                    <strong>{l.label}</strong>
                    <span>{l.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
