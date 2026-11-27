import Link from "next/link";
import { communityCategories } from "@/content/community";
import { activeMembers, categoryCounts, popularTags } from "@/server/services/community";
import { Avatar } from "@/components/ui/primitives";

export async function CategoryPanel({ kind, basePath, current }: { kind: "discussion" | "proposal"; basePath: string; current?: string }) {
  const counts = await categoryCounts(kind);
  return (
    <nav className="panel" aria-label="Categorías">
      <h2 className="panel__title">Categorías</h2>
      <div className="category-list">
        <Link href={basePath} aria-current={!current ? "page" : undefined}>
          <span>Todas</span>
        </Link>
        {communityCategories.map((c) => (
          <Link key={c.slug} href={`${basePath}?categoria=${c.slug}`} aria-current={current === c.slug ? "page" : undefined} title={c.description}>
            <span>{c.name}</span>
            <span className="chip__count">{counts[c.slug] ?? 0}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export async function TagsPanel() {
  const tags = await popularTags(12);
  if (!tags.length) return null;
  return (
    <div className="panel">
      <h2 className="panel__title">Temas populares</h2>
      <div className="cluster" style={{ ["--cluster-gap" as string]: "0.4rem" }}>
        {tags.map((t) => (
          <Link key={t.tag} href={`/comunidad/discusiones?etiqueta=${encodeURIComponent(t.tag)}`} className="tag">
            {t.tag}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function MembersPanel() {
  const members = await activeMembers(5);
  if (!members.length) return null;
  return (
    <div className="panel">
      <h2 className="panel__title">Miembros activos</h2>
      <ul role="list">
        {members.map((m) => (
          <li key={m.handle}>
            <Link href={`/comunidad/miembros/${m.handle}`} className="member-chip">
              <Avatar name={m.displayName} />
              <span>
                <strong className="small">{m.displayName}</strong>
                <small>
                  {m.specialty || "Miembro"} · {m.contributions} aportes
                </small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
