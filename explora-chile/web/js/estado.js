// Progreso del jugador, guardado en el dispositivo (localStorage) con cola de
// envío ("bandeja de salida") para sincronizar con el servidor cuando exista.
import { CATEGORIAS, JUEGO, LOGROS } from "./config.js";

const CLAVE = "explora-chile:v1";

const inicial = () => ({
  xp: 0,
  visitas: {},      // idLugar -> { t, categoria, comuna }
  reportes: [],     // verificaciones de la comunidad
  propuestas: [],   // lugares nuevos sugeridos
  pendientes: [],   // cola para sincronizar con la API
  logros: [],
});

function leer() {
  try { return { ...inicial(), ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; }
  catch { return inicial(); }
}

let s = leer();
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* modo privado */ } };

export const estado = () => s;

export function nivel() {
  let n = 1, resto = s.xp;
  while (resto >= JUEGO.xpPorNivel(n)) { resto -= JUEGO.xpPorNivel(n); n++; }
  return { nivel: n, xpEnNivel: resto, xpNecesaria: JUEGO.xpPorNivel(n) };
}

export function estadisticas() {
  const v = Object.values(s.visitas);
  const porCategoria = {};
  v.forEach((x) => { porCategoria[x.categoria] = (porCategoria[x.categoria] || 0) + 1; });
  return {
    totalVisitas: v.length,
    porCategoria,
    reportes: s.reportes.length,
    propuestas: s.propuestas.length,
    comunas: new Set(v.map((x) => x.comuna)).size,
  };
}

function revisarLogros() {
  const st = estadisticas();
  const nuevos = LOGROS.filter((l) => !s.logros.includes(l.id) && l.test(st));
  nuevos.forEach((l) => s.logros.push(l.id));
  return nuevos;
}

function ganar(xp) {
  const antes = nivel().nivel;
  s.xp += xp;
  return { xp, subioNivel: nivel().nivel > antes };
}

export const visitado = (id) => Boolean(s.visitas[id]);

export function registrarVisita(lugar, comuna) {
  if (visitado(lugar.id)) return null;
  s.visitas[lugar.id] = { t: Date.now(), categoria: lugar.categoria, comuna };
  const r = ganar(CATEGORIAS[lugar.categoria]?.xp ?? 10);
  s.pendientes.push({ tipo: "visita", lugar: lugar.id, comuna, t: Date.now() });
  const logros = revisarLogros();
  guardar();
  return { ...r, logros };
}

/** estadoLugar: "existe" | "cerrado" | "datos_incorrectos" | "no_existe" */
export function registrarReporte(lugar, comuna, estadoLugar, comentario, posicion) {
  const rep = { tipo: "reporte", lugar: lugar.id, comuna, estado: estadoLugar, comentario, posicion, t: Date.now() };
  s.reportes.push(rep);
  s.pendientes.push(rep);
  const r = ganar(JUEGO.xpReporte);
  const logros = revisarLogros();
  guardar();
  return { ...r, logros };
}

export function registrarPropuesta(datos) {
  const p = { tipo: "propuesta", ...datos, t: Date.now() };
  s.propuestas.push(p);
  s.pendientes.push(p);
  const r = ganar(JUEGO.xpPropuesta);
  const logros = revisarLogros();
  guardar();
  return { ...r, logros };
}

export function tomarPendientes() { return [...s.pendientes]; }
export function confirmarEnviados(n) { s.pendientes.splice(0, n); guardar(); }
