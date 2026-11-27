import Link from "next/link";

/** Glifo: tres nodos conectados — explicar, asesorar, conectar. */
export function BrandGlyph({ className = "brandmark__glyph" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#202833" />
      <path d="M16 9.5 9.5 21.5h13Z" fill="none" stroke="#91C5E8" strokeWidth="1.2" strokeLinejoin="round" opacity="0.9" />
      <circle cx="16" cy="9.5" r="2.6" fill="#FFFFFF" />
      <circle cx="9.5" cy="21.5" r="2.6" fill="#91C5E8" />
      <circle cx="22.5" cy="21.5" r="2.6" fill="#397BA9" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  );
}

export function Brandmark() {
  return (
    <Link href="/" className="brandmark" aria-label="Datos con Datos — inicio del ecosistema">
      <BrandGlyph />
      <span>
        Datos con Datos
        <span className="brandmark__sub">Ecosistema</span>
      </span>
    </Link>
  );
}
