import type { ReactNode } from "react";
import { BrandGlyph } from "./Brandmark";

export function AuthShell({ title, lead, children, footer }: { title: string; lead?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth-shell container">
      <div className="auth-card stack stack--lg">
        <div className="stack">
          <BrandGlyph className="brandmark__glyph" />
          <h1 className="h3">{title}</h1>
          {lead && <p className="small muted">{lead}</p>}
        </div>
        {children}
        {footer && <div className="small muted rule-top">{footer}</div>}
      </div>
    </div>
  );
}
