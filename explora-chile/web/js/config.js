// Configuración central. Para escalar a otras comunas NO se toca el código:
// basta con agregar la comuna a data/regiones.json y su archivo GeoJSON.

export const CATEGORIAS = {
  turistico:      { nombre: "Turístico",      icono: "🏞️", color: "#ff9f1c", xp: 50 },
  sendero:        { nombre: "Senderos",       icono: "🥾", color: "#2ecc71", xp: 80 },
  emprendimiento: { nombre: "Emprendimiento", icono: "🧺", color: "#e84393", xp: 40 },
  negocio:        { nombre: "Negocios",       icono: "🏪", color: "#2b7bd8", xp: 20 },
};

// Iconos más específicos por subcategoría (opcional).
export const ICONOS_SUB = {
  playa: "🏖️", plaza: "⛲", volcan: "🌋", cascada: "💧", parque_nacional: "🌲",
  termas: "♨️", aventura: "🚣", mirador: "🔭", museo: "🏛️",
  artesania: "🪵", gastronomia: "🍲", productos_locales: "🍯",
  cafe: "☕", restaurante: "🍽️", hospedaje: "🛏️", arriendo: "🚲", tienda: "🛍️",
};

export const CAPAS = {
  aventura: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    opciones: {
      subdomains: "abcd", maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  satelite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    opciones: { maxZoom: 19, attribution: "Imágenes &copy; Esri, Maxar, Earthstar Geographics" },
  },
  // Etiquetas (calles, nombres) encima del satélite.
  etiquetas: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
    opciones: { subdomains: "abcd", maxZoom: 20, pane: "etiquetas" },
  },
};

export const JUEGO = {
  radioInteraccion: 60,      // metros para poder hacer check-in
  radioVisible: 2500,        // metros para mostrar en el radar "cercanos"
  distanciaMaxGPS: 40000,    // si estás a más de 40 km de la comuna, se sugiere simular
  xpPorNivel: (n) => 100 + (n - 1) * 75,
  xpReporte: 15,
  xpPropuesta: 25,
};

export const LOGROS = [
  { id: "primer-paso",   icono: "👣", nombre: "Primer paso",     test: (s) => s.totalVisitas >= 1 },
  { id: "explorador",    icono: "🧭", nombre: "Explorador",      test: (s) => s.totalVisitas >= 10 },
  { id: "senderista",    icono: "🥾", nombre: "Senderista",      test: (s) => (s.porCategoria.sendero || 0) >= 3 },
  { id: "apoyo-local",   icono: "🤝", nombre: "Apoyo local",     test: (s) => (s.porCategoria.emprendimiento || 0) >= 5 },
  { id: "turista",       icono: "📸", nombre: "Turista pro",     test: (s) => (s.porCategoria.turistico || 0) >= 5 },
  { id: "verificador",   icono: "✅", nombre: "Verificador",     test: (s) => s.reportes >= 5 },
  { id: "cartografo",    icono: "🗺️", nombre: "Cartógrafo",      test: (s) => s.propuestas >= 3 },
  { id: "viajero",       icono: "🇨🇱", nombre: "Viajero de Chile", test: (s) => s.comunas >= 3 },
];

// Si existe un backend (server.py) se sincronizan reportes y propuestas.
export const API_BASE = "api";
