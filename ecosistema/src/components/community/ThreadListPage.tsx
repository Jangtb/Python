import Link from "next/link";
import { categoryName, communityCategories } from "@/content/community";
import { getViewer } from "@/server/auth/session";
import { listOwnUnpublished, listThreads, type ThreadSort } from "@/server/services/community";
import type { ThreadStatus } from "@/server/store/types";
import { EmptyState, PageHero } from "@/components/ui/primitives";
import { CategoryPanel, TagsPanel } from "./Sidebar";
import { ThreadRow } from "./ThreadRow";

export interface ListSearch {
  categoria?: string;
  estado?: string;
  etiqueta?: string;
  q?: string;
  orden?: string;
}

const statusTabs: { value: string; label: string }[] = [
  { value: "", label: "Activas" },
  { value: "unanswered", label: "Sin respuesta" },
  { value: "discussion", label: "En discusión" },
  { value: "resolved", label: "Resueltas" },
  { value: "archived", label: "Archivadas" },
];

const sorts: { value: ThreadSort; label: string }[] = [
  { value: "activity", label: "Actividad reciente" },
  { value: "recent", label: "Más nuevas" },
  { value: "top", label: "Más votadas" },
];

export async function ThreadListPage({ kind, search }: { kind: "discussion" | "proposal"; search: ListSearch }) {
  const viewer = await getViewer();
  const isProposal = kind === "proposal";
  const basePath = isProposal ? "/comunidad/propuestas" : "/comunidad/discusiones";
  const category = communityCategories.some((c) => c.slug === search.categoria) ? search.categoria : undefined;
  const status = statusTabs.some((s) => s.value === search.estado) ? (search.estado as ThreadStatus | "unanswered" | "") : "";
  const sort = sorts.find((s) => s.value === search.orden)?.value;
  const q = (search.q ?? "").slice(0, 100);

  const [threads, own] = await Promise.all([
    listThreads({ kind, category, status: status || undefined, tag: search.etiqueta, q, sort }, viewer),
    listOwnUnpublished(viewer, kind),
  ]);

  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { categoria: category, estado: status || undefined, etiqueta: search.etiqueta, q: q || undefined, orden: sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <>
      <PageHero
        eyebrow="Comunidad de Datos"
        title={isProposal ? "Propuestas e iniciativas" : "Discusiones"}
        lead={
          isProposal
            ? "Ideas para construir entre todos: proyectos, investigaciones, encuentros, talleres, herramientas y recursos compartidos. Apoya las que te interesen."
            : "Desafíos reales de la práctica con datos. Pregunta, responde y marca la solución para que sirva a quien venga después."
        }
        breadcrumbs={[{ name: "Comunidad", href: "/comunidad" }, { name: isProposal ? "Propuestas" : "Discusiones" }]}
      >
        <div className="cluster">
          <Link href={`${basePath}/nueva`} className="btn btn--accent">
            {isProposal ? "Proponer una iniciativa" : "Plantear una consulta"}
          </Link>
        </div>
      </PageHero>

      <section className="section section--tight">
        <div className="container community-layout">
          <div>
            {own.length > 0 && (
              <div className="alert alert--warning" style={{ marginBottom: "var(--space-5)" }}>
                <div className="stack stack--sm">
                  <strong>Tus publicaciones pendientes</strong>
                  <ul role="list">
                    {own.map((t) => (
                      <li key={t.id}>
                        <Link href={`${basePath}/${t.id}`}>{t.title}</Link> — {t.moderation === "pending" ? "en revisión" : "no publicada"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!isProposal && (
              <nav className="tabs" aria-label="Estado de las discusiones">
                {statusTabs.map((s) => (
                  <Link key={s.value} href={qs({ estado: s.value || undefined })} aria-current={status === s.value ? "page" : undefined}>
                    {s.label}
                  </Link>
                ))}
              </nav>
            )}

            <form role="search" method="get" action={basePath} className="cluster" style={{ marginBottom: "var(--space-5)" }}>
              {category && <input type="hidden" name="categoria" value={category} />}
              {status && <input type="hidden" name="estado" value={status} />}
              <label htmlFor="q" className="visually-hidden">
                Buscar
              </label>
              <input id="q" name="q" type="search" className="input" placeholder="Buscar por palabra clave" defaultValue={q} style={{ flex: "1 1 220px", width: "auto" }} />
              <label htmlFor="orden" className="visually-hidden">
                Ordenar
              </label>
              <select id="orden" name="orden" className="select" defaultValue={sort ?? ""} style={{ width: "auto" }}>
                <option value="">{isProposal ? "Más apoyadas" : "Actividad reciente"}</option>
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn--secondary">
                Aplicar
              </button>
            </form>

            {(category || search.etiqueta || q) && (
              <p className="small muted" role="status" style={{ marginBottom: "var(--space-4)" }}>
                {threads.length} resultados
                {category && ` en «${categoryName(category)}»`}
                {search.etiqueta && ` con la etiqueta «${search.etiqueta}»`}
                {q && ` para «${q}»`} · <Link href={basePath}>Quitar filtros</Link>
              </p>
            )}

            {threads.length ? (
              <div className="thread-list">
                {threads.map((t) => (
                  <ThreadRow key={t.id} thread={t} headingLevel={2} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={isProposal ? "No hay propuestas con esos criterios." : "No hay discusiones con esos criterios."}
                action={
                  <Link href={`${basePath}/nueva`} className="btn btn--sm btn--accent">
                    {isProposal ? "Proponer la primera" : "Plantear la primera"}
                  </Link>
                }
              >
                Prueba con otros filtros o sé la primera persona en abrir el tema.
              </EmptyState>
            )}
          </div>
          <aside className="stack" aria-label="Filtros y temas">
            <CategoryPanel kind={kind} basePath={basePath} current={category} />
            {!isProposal && <TagsPanel />}
          </aside>
        </div>
      </section>
    </>
  );
}
