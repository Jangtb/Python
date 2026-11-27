import Link from "next/link";
import type { ReactNode } from "react";
import { avatarTone, initials } from "@/lib/text";
import { InboxIcon } from "./icons";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Ruta de navegación">
      <ol>
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`}>
            {item.href && i < items.length - 1 ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  breadcrumbs,
  aside,
  brandSurface = false,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  breadcrumbs?: { name: string; href?: string }[];
  aside?: ReactNode;
  brandSurface?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={`page-hero${brandSurface ? " page-hero--brand" : ""}`}>
      <div className="container">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className={`page-hero__grid${aside ? " page-hero__grid--split" : ""}`}>
          <div className="stack stack--lg">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className="h1">{title}</h1>
            {lead && <p className="lead">{lead}</p>}
            {children}
          </div>
          {aside && <div>{aside}</div>}
        </div>
      </div>
    </header>
  );
}

export function SectionHead({ eyebrow, title, lead, action, id }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className={`section-head${lead || action ? " section-head--split" : ""}`}>
      <div className="stack">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="h2" id={id}>
          {title}
        </h2>
      </div>
      {(lead || action) && (
        <div className="stack">
          {lead && <p className="muted">{lead}</p>}
          {action}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <InboxIcon className="empty-state__glyph" size={40} />
      <p className="h4">{title}</p>
      {children && <div className="muted small">{children}</div>}
      {action}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`avatar${size !== "md" ? ` avatar--${size}` : ""}`} style={{ ["--avatar-bg" as string]: avatarTone(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function DemoBadge({ label = "Ejemplo" }: { label?: string }) {
  return (
    <span className="badge badge--demo" title="Contenido de demostración: no corresponde a actividad real">
      {label}
    </span>
  );
}

export function Provisional({ children, when = true }: { children: ReactNode; when?: boolean }) {
  if (!when) return <>{children}</>;
  return (
    <span className="provisional" title="Contenido provisional: reemplazar en src/content/consulting.ts">
      {children}
    </span>
  );
}

export function CtaBand({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children: ReactNode }) {
  return (
    <div className="cta-band">
      <div className="stack">
        {eyebrow && (
          <span className="eyebrow" style={{ color: "var(--c-soft-blue)" }}>
            {eyebrow}
          </span>
        )}
        <h2 className="h2" style={{ color: "#fff", maxWidth: "22ch" }}>
          {title}
        </h2>
        {text && <p className="muted measure">{text}</p>}
      </div>
      <div className="cluster">{children}</div>
    </div>
  );
}
