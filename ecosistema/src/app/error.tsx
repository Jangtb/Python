"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="section">
      <div className="container container--narrow stack stack--lg" role="alert">
        <span className="eyebrow">Algo salió mal</span>
        <h1 className="h1">No pudimos cargar esta página.</h1>
        <p className="lead">Fue un error de nuestro lado. Puedes intentarlo de nuevo; si persiste, escríbenos.</p>
        {error.digest && <p className="xsmall muted">Código de referencia: {error.digest}</p>}
        <div className="cluster">
          <button type="button" className="btn btn--accent" onClick={reset}>
            Reintentar
          </button>
          <Link href="/" className="btn btn--secondary">
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
