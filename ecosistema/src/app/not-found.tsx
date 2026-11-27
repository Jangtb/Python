import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container container--narrow stack stack--lg">
        <span className="eyebrow">Error 404</span>
        <h1 className="h1">Esta página no existe (o ya no está aquí).</h1>
        <p className="lead">Puede que el enlace esté incompleto o que el contenido haya sido movido o retirado por moderación.</p>
        <div className="cluster">
          <Link href="/" className="btn btn--accent">
            Ir al inicio
          </Link>
          <Link href="/datos-con-datos/articulos" className="btn btn--secondary">
            Ver artículos
          </Link>
          <Link href="/comunidad" className="btn btn--ghost">
            Ir a la comunidad
          </Link>
        </div>
      </div>
    </section>
  );
}
