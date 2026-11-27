import Link from "next/link";
import { contentSource } from "@/lib/content";
import { requireModeratorPage } from "@/server/auth/session";

export default async function ContentPage() {
  await requireModeratorPage("/admin/contenido");
  const [articles, workshops, groups] = await Promise.all([contentSource.listArticles(), contentSource.listWorkshops(), contentSource.listServiceGroups()]);
  return (
    <>
      <h1 className="h2">Contenido editorial</h1>
      <div className="alert alert--info">
        <div>
          <strong>Gestión de contenido</strong>
          Hoy los artículos, recursos, servicios y talleres se editan en <code>src/content/</code> (archivos tipados y validados en la compilación). La interfaz consume el contrato <code>ContentSource</code>, preparado para conectar Sanity sin modificar las páginas: ver <code>docs/ARQUITECTURA.md</code>.
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value">{articles.length}</div>
          <div className="stat__label">Artículos publicados</div>
        </div>
        <div className="stat">
          <div className="stat__value">{workshops.length}</div>
          <div className="stat__label">Talleres</div>
        </div>
        <div className="stat">
          <div className="stat__value">{groups.reduce((n, g) => n + g.items.length, 0)}</div>
          <div className="stat__label">Servicios</div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Publicado</th>
              <th>Fuentes</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.slug}>
                <td>
                  <Link href={`/datos-con-datos/articulos/${a.slug}`}>{a.title}</Link>
                </td>
                <td className="xsmall">{a.publishedAt}</td>
                <td>{a.sources.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
