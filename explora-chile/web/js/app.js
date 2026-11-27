import { CATEGORIAS, ICONOS_SUB, CAPAS, JUEGO, LOGROS } from "./config.js";
import { distancia, distanciaALinea, formatoDistancia } from "./geo.js";
import * as E from "./estado.js";
import { sincronizar, lugaresComunidad } from "./api.js";

const $ = (s) => document.querySelector(s);
const esc = (t = "") => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------------------------------------------------------------- estado UI
const ui = {
  comuna: null,          // objeto de regiones.json
  lugares: [],           // { id, nombre, categoria, ..., latlng, linea?, marcador }
  filtros: new Set(Object.keys(CATEGORIAS)),
  pos: null,             // [lat, lng] actual del jugador
  gpsPos: null,          // última posición GPS real
  simulando: false,
  capa: "aventura",
  animacion: null,
};

// ---------------------------------------------------------------- mapa
const mapa = L.map("mapa", { zoomControl: false, attributionControl: true, tap: true }).setView([-39.28, -71.96], 15);
mapa.createPane("etiquetas").style.zIndex = 450;
mapa.getPane("etiquetas").style.pointerEvents = "none";

const capas = {
  aventura: L.tileLayer(CAPAS.aventura.url, CAPAS.aventura.opciones),
  satelite: L.layerGroup([
    L.tileLayer(CAPAS.satelite.url, CAPAS.satelite.opciones),
    L.tileLayer(CAPAS.etiquetas.url, CAPAS.etiquetas.opciones),
  ]),
};
capas.aventura.addTo(mapa);
const grupoLugares = L.layerGroup().addTo(mapa);

function cambiarCapa() {
  mapa.removeLayer(capas[ui.capa]);
  ui.capa = ui.capa === "aventura" ? "satelite" : "aventura";
  capas[ui.capa].addTo(mapa);
  $("#mapa").classList.toggle("estilo-aventura", ui.capa === "aventura");
  $("#btn-capa").textContent = ui.capa === "aventura" ? "🛰️" : "🗺️";
  $("#btn-capa").title = ui.capa === "aventura" ? "Cambiar a satélite" : "Cambiar a mapa aventura";
}

function modoNoche() {
  const h = new Date().getHours();
  $("#mapa").classList.toggle("noche", h >= 21 || h < 7);
}

// ---------------------------------------------------------------- jugador
const iconoJugador = (sim) => L.divIcon({
  className: "", iconSize: [36, 36], iconAnchor: [18, 18],
  html: `<div class="jugador ${sim ? "simulado" : ""}"><div class="onda"></div><div class="punto"></div></div>`,
});
const jugador = L.marker([0, 0], { icon: iconoJugador(false), interactive: false, zIndexOffset: 1000 });
const radio = L.circle([0, 0], { radius: JUEGO.radioInteraccion, color: "#2b7bd8", weight: 2, fillOpacity: .08, interactive: false });

function moverJugador(latlng, { centrar = false } = {}) {
  ui.pos = latlng;
  if (!mapa.hasLayer(jugador)) { jugador.addTo(mapa); radio.addTo(mapa); }
  jugador.setLatLng(latlng);
  radio.setLatLng(latlng);
  if (centrar) mapa.panTo(latlng);
  actualizarCercania();
}

function iniciarGPS() {
  if (!("geolocation" in navigator)) { activarSimulacion(true, "Tu dispositivo no tiene GPS: modo simulación activado"); return; }
  navigator.geolocation.watchPosition(
    (p) => {
      ui.gpsPos = [p.coords.latitude, p.coords.longitude];
      if (ui.simulando) return;
      const lejos = ui.comuna && distancia(ui.gpsPos, ui.comuna.centro) > JUEGO.distanciaMaxGPS;
      if (lejos) { activarSimulacion(true, `Estás lejos de ${ui.comuna.nombre}: toca el mapa para explorar en simulación`); return; }
      const primera = !ui.pos;
      moverJugador(ui.gpsPos, { centrar: primera });
    },
    () => activarSimulacion(true, "Sin permiso de ubicación: toca el mapa para caminar"),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
}

function activarSimulacion(on, mensaje) {
  ui.simulando = on;
  $("#btn-simular").classList.toggle("activo", on);
  jugador.setIcon(iconoJugador(on));
  if (on) {
    if (!ui.pos && ui.comuna) moverJugador(ui.comuna.centro, { centrar: true });
    toast(mensaje || "Modo simulación: toca el mapa para caminar");
  } else if (ui.gpsPos) {
    moverJugador(ui.gpsPos, { centrar: true });
    toast("Usando tu GPS real");
  } else {
    toast("Esperando señal GPS…");
  }
}

// Caminata animada en modo simulación (velocidad "de juego").
function caminarHacia(destino) {
  cancelAnimationFrame(ui.animacion);
  const origen = ui.pos || destino;
  const d = distancia(origen, destino);
  const dur = Math.min(4000, Math.max(300, d / 0.06)); // ~60 m/s, máx 4 s
  const t0 = performance.now();
  const paso = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    moverJugador([origen[0] + (destino[0] - origen[0]) * k, origen[1] + (destino[1] - origen[1]) * k]);
    if (k < 1) ui.animacion = requestAnimationFrame(paso);
  };
  ui.animacion = requestAnimationFrame(paso);
}

mapa.on("click", (e) => { if (ui.simulando) caminarHacia([e.latlng.lat, e.latlng.lng]); });

// ---------------------------------------------------------------- lugares
function iconoLugar(l) {
  const cat = CATEGORIAS[l.categoria];
  const ico = ICONOS_SUB[l.subcategoria] || cat.icono;
  const clases = ["poi", E.visitado(l.id) ? "visitado" : "", l.cerca ? "cerca" : ""].join(" ");
  return L.divIcon({
    className: "", iconSize: [44, 44], iconAnchor: [22, 22],
    html: `<div class="${clases}" style="--c:${cat.color}">${ico}</div>`,
  });
}

function normalizar(f) {
  const p = f.properties || {};
  if (!CATEGORIAS[p.categoria]) return null;
  const g = f.geometry;
  let latlng, linea = null;
  if (g.type === "Point") latlng = [g.coordinates[1], g.coordinates[0]];
  else if (g.type === "LineString") { linea = g.coordinates.map(([x, y]) => [y, x]); latlng = linea[0]; }
  else if (g.type === "Polygon") {
    const anillo = g.coordinates[0];
    latlng = [anillo.reduce((a, c) => a + c[1], 0) / anillo.length, anillo.reduce((a, c) => a + c[0], 0) / anillo.length];
  } else return null;
  return { ...p, latlng, linea, cerca: false };
}

function pintarLugares() {
  grupoLugares.clearLayers();
  ui.lugares.forEach((l) => {
    if (!ui.filtros.has(l.categoria)) return;
    if (l.linea) {
      L.polyline(l.linea, { color: CATEGORIAS.sendero.color, weight: 6, opacity: .85, dashArray: "1 10", lineCap: "round" })
        .on("click", () => abrirLugar(l)).addTo(grupoLugares);
    }
    l.marcador = L.marker(l.latlng, { icon: iconoLugar(l) }).on("click", () => abrirLugar(l)).addTo(grupoLugares);
  });
}

function distanciaA(l) {
  if (!ui.pos) return Infinity;
  return l.linea ? distanciaALinea(ui.pos, l.linea) : distancia(ui.pos, l.latlng);
}

function actualizarCercania() {
  let cercanos = 0, masCercano = null;
  ui.lugares.forEach((l) => {
    l.dist = distanciaA(l);
    const cerca = l.dist <= JUEGO.radioInteraccion;
    if (cerca !== l.cerca) { l.cerca = cerca; l.marcador?.setIcon(iconoLugar(l)); }
    if (l.dist <= JUEGO.radioVisible && ui.filtros.has(l.categoria)) cercanos++;
    if (ui.filtros.has(l.categoria) && (!masCercano || l.dist < masCercano.dist)) masCercano = l;
  });
  const r = $("#radar-texto");
  if (!ui.pos) r.textContent = "Buscando ubicación…";
  else if (masCercano?.cerca) r.textContent = `✨ ¡${masCercano.nombre} está aquí! Toca para verificar`;
  else if (masCercano) r.textContent = `📡 ${cercanos} cerca · ${masCercano.nombre} a ${formatoDistancia(masCercano.dist)}`;
  else r.textContent = "📡 Sin lugares en esta comuna aún";
  if ($("#hoja").dataset.lugar) refrescarHojaLugar();
}

// ---------------------------------------------------------------- comunas
async function cargarRegiones() {
  const datos = await (await fetch("data/regiones.json")).json();
  const sel = $("#sel-comuna");
  const indice = {};
  datos.regiones.forEach((r) => {
    const og = document.createElement("optgroup");
    og.label = r.nombre;
    if (!r.comunas.length) {
      const o = new Option("Próximamente", "", false, false); o.disabled = true; og.append(o);
    }
    r.comunas.forEach((c) => {
      c.region = r.nombre;
      indice[c.cut] = c;
      const o = new Option(c.disponible ? c.nombre : `${c.nombre} (próximamente)`, c.cut);
      o.disabled = !c.disponible;
      og.append(o);
    });
    sel.append(og);
  });
  sel.addEventListener("change", () => cargarComuna(indice[sel.value]));
  const guardada = (() => { try { return localStorage.getItem("explora-chile:comuna"); } catch { return null; } })();
  const inicial = indice[guardada]?.disponible ? guardada : datos.comuna_inicial;
  sel.value = inicial;
  await cargarComuna(indice[inicial]);
}

async function cargarComuna(c) {
  if (!c) return;
  ui.comuna = c;
  try { localStorage.setItem("explora-chile:comuna", c.cut); } catch { /* sin almacenamiento */ }
  cerrarHoja();
  const geo = await (await fetch(c.archivo)).json();
  const extra = await lugaresComunidad(c.cut);
  const vistos = new Set();
  ui.lugares = [...geo.features, ...extra].map(normalizar).filter((l) => l && !vistos.has(l.id) && vistos.add(l.id));
  pintarLugares();
  mapa.setView(c.centro, c.zoom);
  if (ui.simulando || !ui.gpsPos || distancia(ui.gpsPos, c.centro) > JUEGO.distanciaMaxGPS) {
    if (ui.gpsPos || ui.simulando) activarSimulacion(true, `Explorando ${c.nombre} en simulación`);
    moverJugador(c.centro);
  } else {
    moverJugador(ui.gpsPos);
  }
}

// ---------------------------------------------------------------- filtros
function pintarFiltros() {
  const nav = $("#filtros");
  nav.innerHTML = Object.entries(CATEGORIAS).map(([k, c]) =>
    `<button class="chip ${ui.filtros.has(k) ? "activo" : ""}" data-cat="${k}" style="--c:${c.color}">${c.icono} ${c.nombre}</button>`).join("");
  nav.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.cat;
    ui.filtros.has(k) ? ui.filtros.delete(k) : ui.filtros.add(k);
    pintarFiltros(); pintarLugares(); actualizarCercania();
  }));
}

// ---------------------------------------------------------------- hoja inferior
function abrirHoja(html, lugarId = "") {
  $("#hoja-contenido").innerHTML = html;
  $("#hoja").dataset.lugar = lugarId;
  $("#hoja").classList.add("abierta");
  $("#hoja").setAttribute("aria-hidden", "false");
}
function cerrarHoja() {
  $("#hoja").classList.remove("abierta");
  $("#hoja").setAttribute("aria-hidden", "true");
  $("#hoja").dataset.lugar = "";
}
$("#hoja .cerrar").addEventListener("click", cerrarHoja);

function abrirLugar(l) {
  abrirHoja("", l.id);
  refrescarHojaLugar();
  mapa.panTo(l.latlng);
}

function refrescarHojaLugar() {
  const l = ui.lugares.find((x) => x.id === $("#hoja").dataset.lugar);
  if (!l) return;
  const cat = CATEGORIAS[l.categoria];
  const hecho = E.visitado(l.id);
  const extras = [
    l.dificultad && `Dificultad: <b>${esc(l.dificultad)}</b>`,
    l.distancia_km && `Distancia: <b>${esc(l.distancia_km)} km</b>`,
    l.direccion && `📍 ${esc(l.direccion)}`,
    l.horario && `🕒 ${esc(l.horario)}`,
    l.telefono && `📞 <a href="tel:${esc(l.telefono)}">${esc(l.telefono)}</a>`,
    l.web && `🌐 <a href="${esc(l.web)}" target="_blank" rel="noopener">${esc(l.web)}</a>`,
  ].filter(Boolean).join("<br>");
  const fuente = { semilla: "dato inicial", osm: "OpenStreetMap", comunidad: "comunidad", demo: "ejemplo" }[l.fuente] || l.fuente || "";
  $("#hoja-contenido").innerHTML = `
    <h2>${ICONOS_SUB[l.subcategoria] || cat.icono} ${esc(l.nombre)}</h2>
    <div class="meta">
      <span class="etiqueta" style="--c:${cat.color}">${cat.nombre}</span>
      <span class="etiqueta ${l.verificado ? "" : "gris"}">${l.verificado ? "✔ Verificado" : "Sin verificar"}</span>
      ${fuente ? `<span class="etiqueta gris">${esc(fuente)}</span>` : ""}
      · ${Number.isFinite(l.dist) ? formatoDistancia(l.dist) : "—"}
    </div>
    ${l.descripcion ? `<p>${esc(l.descripcion)}</p>` : ""}
    ${extras ? `<p>${extras}</p>` : ""}
    <div class="acciones">
      <button class="btn principal" id="btn-checkin" ${hecho || !l.cerca ? "disabled" : ""}>
        ${hecho ? "✓ Ya lo visitaste" : l.cerca ? `Check-in (+${cat.xp} XP)` : `Acércate a ${JUEGO.radioInteraccion} m para hacer check-in`}
      </button>
      <button class="btn" data-rep="existe" ${l.cerca ? "" : "disabled"}>👍 Existe</button>
      <button class="btn" data-rep="cerrado" ${l.cerca ? "" : "disabled"}>🚫 Cerrado</button>
      <button class="btn" data-rep="datos_incorrectos" ${l.cerca ? "" : "disabled"}>✏️ Datos erróneos</button>
      <a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${l.latlng[0]},${l.latlng[1]}" target="_blank" rel="noopener">🧭 Cómo llegar</a>
    </div>`;
  $("#btn-checkin").addEventListener("click", () => {
    const r = E.registrarVisita(l, ui.comuna.cut);
    if (r) { celebrar(`+${r.xp} XP · ${l.nombre}`, r); l.marcador?.setIcon(iconoLugar(l)); }
    refrescarHojaLugar();
  });
  $("#hoja-contenido").querySelectorAll("[data-rep]").forEach((b) => b.addEventListener("click", () => {
    const comentario = b.dataset.rep === "existe" ? "" : (prompt("¿Qué está mal o qué cambió? (opcional)") || "");
    const r = E.registrarReporte(l, ui.comuna.cut, b.dataset.rep, comentario, ui.pos);
    celebrar(`¡Gracias por verificar! +${r.xp} XP`, r);
  }));
}

function abrirPerfil() {
  const n = E.nivel(), st = E.estadisticas(), s = E.estado();
  abrirHoja(`
    <h2>🧭 Tu exploración</h2>
    <div class="meta">Nivel ${n.nivel} · ${n.xpEnNivel}/${n.xpNecesaria} XP para el siguiente</div>
    <div class="stats">
      <div><b>${st.totalVisitas}</b>Lugares</div>
      <div><b>${st.reportes}</b>Verificaciones</div>
      <div><b>${st.comunas}</b>Comunas</div>
    </div>
    <h3>Logros</h3>
    <div class="logros">${LOGROS.map((l) => `<div class="logro ${s.logros.includes(l.id) ? "ok" : ""}"><span class="ico">${l.icono}</span>${l.nombre}</div>`).join("")}</div>
    <h3>Por categoría</h3>
    <ul class="lista">${Object.entries(CATEGORIAS).map(([k, c]) => {
      const total = ui.lugares.filter((x) => x.categoria === k).length;
      return `<li><span class="ico">${c.icono}</span>${c.nombre}<span class="dist">${st.porCategoria[k] || 0} visitados · ${total} en ${esc(ui.comuna?.nombre || "")}</span></li>`;
    }).join("")}</ul>
    <p class="meta">${s.pendientes.length ? `${s.pendientes.length} aportes pendientes de sincronizar.` : "Todo sincronizado."}</p>`);
}

function abrirCercanos() {
  const lista = ui.lugares.filter((l) => ui.filtros.has(l.categoria)).sort((a, b) => a.dist - b.dist).slice(0, 30);
  abrirHoja(`
    <h2>📡 Cerca de ti</h2>
    <ul class="lista">${lista.map((l) => `
      <li data-id="${esc(l.id)}"><span class="ico">${ICONOS_SUB[l.subcategoria] || CATEGORIAS[l.categoria].icono}</span>
        <span>${esc(l.nombre)}${E.visitado(l.id) ? " ✓" : ""}</span>
        <span class="dist">${formatoDistancia(l.dist)}</span></li>`).join("") || "<li>Sin lugares cargados.</li>"}
    </ul>`);
  $("#hoja-contenido").querySelectorAll("li[data-id]").forEach((li) =>
    li.addEventListener("click", () => abrirLugar(ui.lugares.find((x) => x.id === li.dataset.id))));
}

function abrirProponer() {
  if (!ui.pos) { toast("Necesitamos tu ubicación para proponer un lugar"); return; }
  abrirHoja(`
    <h2>➕ Proponer lugar</h2>
    <div class="meta">Se registrará en tu posición actual (${ui.pos[0].toFixed(5)}, ${ui.pos[1].toFixed(5)}). Un moderador lo revisará.</div>
    <form class="prop" id="form-prop">
      <label>Nombre</label><input name="nombre" required maxlength="120">
      <label>Categoría</label>
      <select name="categoria">${Object.entries(CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.icono} ${c.nombre}</option>`).join("")}</select>
      <label>Descripción</label><textarea name="descripcion" rows="3" maxlength="600"></textarea>
      <label>Teléfono o web (opcional)</label><input name="contacto" maxlength="200">
      <div class="acciones"><button class="btn principal" type="submit">Enviar propuesta</button></div>
    </form>`);
  $("#form-prop").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const r = E.registrarPropuesta({ ...d, comuna: ui.comuna.cut, posicion: ui.pos });
    cerrarHoja();
    celebrar(`Propuesta enviada +${r.xp} XP`, r);
  });
}

// ---------------------------------------------------------------- feedback
let tToast;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("visible");
  clearTimeout(tToast);
  tToast = setTimeout(() => t.classList.remove("visible"), 3200);
}

function celebrar(msg, r) {
  pintarNivel();
  let texto = msg;
  if (r?.subioNivel) texto += ` · ¡Subiste a nivel ${E.nivel().nivel}! 🎉`;
  if (r?.logros?.length) texto += ` · Logro: ${r.logros.map((l) => `${l.icono} ${l.nombre}`).join(", ")}`;
  toast(texto);
  navigator.vibrate?.(80);
  sincronizar();
}

function pintarNivel() {
  const n = E.nivel();
  $("#nivel").textContent = n.nivel;
  $("#xp-barra").style.width = `${(100 * n.xpEnNivel) / n.xpNecesaria}%`;
}

// ---------------------------------------------------------------- arranque
$("#btn-capa").addEventListener("click", cambiarCapa);
$("#btn-centrar").addEventListener("click", () => ui.pos && mapa.setView(ui.pos, Math.max(mapa.getZoom(), 16)));
$("#btn-simular").addEventListener("click", () => activarSimulacion(!ui.simulando));
$("#btn-proponer").addEventListener("click", abrirProponer);
$("#btn-perfil").addEventListener("click", abrirPerfil);
$("#radar").addEventListener("click", () => {
  const aqui = ui.lugares.find((l) => l.cerca && ui.filtros.has(l.categoria));
  aqui ? abrirLugar(aqui) : abrirCercanos();
});
window.addEventListener("online", sincronizar);

pintarFiltros();
pintarNivel();
modoNoche();
setInterval(modoNoche, 10 * 60 * 1000);
await cargarRegiones();
iniciarGPS();
sincronizar();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// Exponer para depuración / pruebas automatizadas.
window.explora = { ui, mapa, caminarHacia, moverJugador, activarSimulacion };
