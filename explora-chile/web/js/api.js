// Sincronización opcional con el backend (server.py). Si no hay servidor,
// todo sigue funcionando en el dispositivo y se reintenta más tarde.
import { API_BASE } from "./config.js";
import { tomarPendientes, confirmarEnviados } from "./estado.js";

let enCurso = false;

export async function sincronizar() {
  if (enCurso || !navigator.onLine) return 0;
  const lote = tomarPendientes();
  if (!lote.length) return 0;
  enCurso = true;
  try {
    const r = await fetch(`${API_BASE}/eventos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventos: lote }),
    });
    if (!r.ok) return 0;
    confirmarEnviados(lote.length);
    return lote.length;
  } catch {
    return 0;
  } finally {
    enCurso = false;
  }
}

/** Lugares aportados por la comunidad y aprobados en el servidor (si existe). */
export async function lugaresComunidad(cut) {
  try {
    const r = await fetch(`${API_BASE}/lugares?comuna=${encodeURIComponent(cut)}`);
    if (!r.ok) return [];
    const geo = await r.json();
    return geo.features || [];
  } catch {
    return [];
  }
}
