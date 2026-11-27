export default function Loading() {
  return (
    <div className="container section" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Cargando…</span>
      <div className="stack stack--lg" aria-hidden="true">
        <div className="skeleton" style={{ height: 14, width: 160 }} />
        <div className="skeleton" style={{ height: 48, width: "70%" }} />
        <div className="skeleton" style={{ height: 18, width: "50%" }} />
        <div className="grid grid--3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 180 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
