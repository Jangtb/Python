const R = 6371000; // radio terrestre en metros
const rad = (g) => (g * Math.PI) / 180;

/** Distancia en metros entre dos puntos [lat, lng]. */
export function distancia(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distancia mínima desde un punto a una polilínea (lista de [lat, lng]), aproximación plana local. */
export function distanciaALinea(p, linea) {
  if (linea.length === 1) return distancia(p, linea[0]);
  const kx = Math.cos(rad(p[0])) * 111320, ky = 110540;
  const P = [p[1] * kx, p[0] * ky];
  let min = Infinity;
  for (let i = 0; i < linea.length - 1; i++) {
    const A = [linea[i][1] * kx, linea[i][0] * ky];
    const B = [linea[i + 1][1] * kx, linea[i + 1][0] * ky];
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / len2));
    const X = A[0] + t * dx, Y = A[1] + t * dy;
    min = Math.min(min, Math.hypot(P[0] - X, P[1] - Y));
  }
  return min;
}

export function formatoDistancia(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}
