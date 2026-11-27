"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

/** Compartir sin scripts de terceros: enlaces directos + copiar enlace / Web Share API. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { name: "X", href: `https://x.com/intent/post?text=${t}&url=${u}` },
  ];

  async function copy() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
      track("Compartir", { method: "nativo" });
    } catch {
      /* la persona canceló */
    }
  }

  return (
    <div className="stack stack--sm">
      <span className="eyebrow eyebrow--plain">Compartir</span>
      <div className="share">
        {links.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--secondary" onClick={() => track("Compartir", { method: l.name })}>
            {l.name}
            <span className="visually-hidden">(nueva pestaña)</span>
          </a>
        ))}
        <button type="button" className="btn btn--sm btn--secondary" onClick={copy}>
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </button>
      </div>
      <span role="status" aria-live="polite" className="visually-hidden">
        {copied ? "Enlace copiado al portapapeles" : ""}
      </span>
    </div>
  );
}
