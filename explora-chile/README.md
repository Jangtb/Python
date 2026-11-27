# Explora Chile 🇨🇱

App web (instalable en el celular) para **recorrer y verificar** lugares turísticos,
emprendimientos locales, negocios y senderos. Tiene un mapa estilo juego de
exploración y un modo satelital. Parte en **Pucón** y está diseñada para escalar a
cualquier comuna de Chile sin tocar el código.

## ▶️ Cómo probarla (paso a paso)

### En tu computador
1. Abre la carpeta `explora-chile` (dentro de la carpeta `python` que descargaste).
2. Doble clic en **`INICIAR-WINDOWS.bat`** (en Mac: `iniciar-mac-linux.command`).
3. Se abre el navegador solo. **No cierres la ventana negra** mientras usas la app.
4. Toca el mapa: tu avatar 🟣 camina hasta ahí. Acércate a un ícono y toca la barra
   de abajo para hacer **check-in**.

¿Aparece "No encontré Python"? Instálalo desde python.org marcando
**"Add python.exe to PATH"** y repite el paso 2.

### En el celular, con GPS (recorriendo Pucón)
Una sola vez, en GitHub: **Settings → Pages → Source: GitHub Actions**. Cada vez que el
código llegue a `master`, la app se publica sola en `https://<usuario>.github.io/<repo>/`.
Ábrela en el celular → menú del navegador → **"Agregar a pantalla de inicio"**.

## Cómo funciona

| Función | Detalle |
|---|---|
| 🗺️ **Mapa aventura** | Colores saturados tipo juego, cielo en el horizonte y modo noche automático (21:00–7:00). |
| 🛰️ **Satélite** | Imágenes Esri World Imagery con calles y nombres encima. Se cambia con un botón. |
| 📍 **GPS en vivo** | Tu avatar se mueve contigo. Los lugares a menos de **60 m** laten y permiten hacer *check-in*. |
| 🎮 **Simulación** | Sin GPS o lejos de la comuna: toca el mapa y el avatar camina hasta ahí (sirve para probar y para planificar). |
| ✅ **Verificación** | En el lugar puedes marcar *Existe / Cerrado / Datos erróneos*. Así la comunidad mantiene los datos al día. |
| ➕ **Proponer lugar** | Registra un emprendimiento o negocio nuevo en tu posición; un moderador lo aprueba. |
| ⭐ **XP, niveles y logros** | Senderista, Apoyo local, Verificador, Viajero de Chile… |
| 📶 **Funciona sin conexión** | PWA con service worker: guarda la app y las teselas vistas; los aportes se sincronizan al volver la señal. |

## Probarla

```bash
cd explora-chile
python server.py
```

Abre <http://localhost:8000>. En el celular (misma red Wi‑Fi) abre `http://IP-DE-TU-PC:8000`.
El GPS del navegador exige **HTTPS** fuera de `localhost`: para probar en terreno publícala
en un hosting con HTTPS (ver *Despliegue*). Mientras tanto, usa el botón 🎮.

Solo necesitas Python 3.9+; no hay dependencias externas (Leaflet viene incluido en `web/vendor`).

## Estructura

```
explora-chile/
├── server.py                 # servidor + API (Python estándar + SQLite)
├── tools/
│   ├── importar_osm.py       # crea/actualiza una comuna desde OpenStreetMap
│   └── validar_datos.py      # revisa todos los datos (útil en CI)
└── web/
    ├── index.html, css/, js/ # la app (Leaflet + módulos JS)
    ├── sw.js, manifest.webmanifest
    └── data/
        ├── regiones.json     # índice: 16 regiones → comunas → archivo
        └── araucania/pucon.geojson
```

## Escalar a otras comunas

1. Busca el **código CUT** de la comuna (5 dígitos, p. ej. Villarrica = `09120`).
2. Importa sus lugares desde OpenStreetMap:
   ```bash
   python tools/importar_osm.py --comuna "Villarrica" --cut 09120 --region-codigo 09
   ```
   Crea `web/data/araucania/villarrica.geojson` y la deja **disponible** en `regiones.json`.
   Con `--mezclar` se conservan los lugares cargados a mano o por la comunidad.
3. Valida: `python tools/validar_datos.py`.

La app solo descarga el archivo de la comuna elegida, así que agregar 346 comunas no
la hace más pesada.

### Formato de un lugar (GeoJSON)

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [-71.9555, -39.2815] },
  "properties": {
    "id": "pucon-plaza-armas",
    "nombre": "Plaza de Armas de Pucón",
    "categoria": "turistico",          // turistico | sendero | emprendimiento | negocio
    "subcategoria": "plaza",           // define el ícono (ver js/config.js)
    "descripcion": "…", "direccion": "…", "telefono": "…", "web": "…", "horario": "…",
    "dificultad": "media", "distancia_km": 7,   // senderos
    "fuente": "semilla",               // semilla | osm | comunidad | demo
    "verificado": false
  }
}
```

Los senderos usan `LineString`; el check-in se activa al estar a 60 m de cualquier punto del trazado.

## ⚠️ Sobre los datos de Pucón incluidos

- Las coordenadas de los atractivos y senderos son **aproximadas** (`verificado: false`):
  justamente la idea es confirmarlas en terreno con la app.
- Los emprendimientos y negocios marcados **"Ejemplo:"** (`fuente: "demo"`) son de muestra.
  Reemplázalos con `importar_osm.py` y con el registro real de emprendedores (Municipalidad,
  Cámara de Turismo, SERCOTEC, SERNATUR).
- Ascenso al volcán: siempre con guía certificado y revisando la alerta de SERNAGEOMIN.

## API

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/salud` | estado |
| POST | `/api/eventos` | la app envía check-ins, reportes y propuestas en lote |
| GET | `/api/lugares?comuna=09115` | lugares de la comunidad ya aprobados |
| GET | `/api/resumen?comuna=09115` | visitas y reportes por lugar (para el municipio) |
| GET | `/api/moderacion/propuestas` | pendientes (cabecera `X-Admin-Token`) |
| POST | `/api/moderacion/aprobar` | `{"id": 1, "aprobar": true}` (cabecera `X-Admin-Token`) |

Define el token con `EXPLORA_ADMIN_TOKEN=... python server.py`.

## Hoja de ruta para llegar a todo Chile

1. **Piloto Pucón**: validar en terreno con Municipalidad / Cámara de Turismo; cargar
   emprendimientos reales; recorrer y verificar los atractivos.
2. **Despliegue**: la carpeta `web/` es estática (Cloudflare Pages, Netlify, GitHub Pages);
   la API en cualquier servicio con Python. HTTPS es obligatorio para el GPS.
3. **Base de datos nacional**: migrar SQLite → PostgreSQL + PostGIS y servir lugares por
   *bounding box* además de por comuna; teselas vectoriales propias (OpenMapTiles/Protomaps)
   para no depender de proveedores y ganar estilo propio del mapa.
4. **Cuentas y confianza**: inicio de sesión (Clave Única / Google), reputación del verificador,
   un lugar pasa a "verificado" con N confirmaciones independientes en terreno.
5. **Comercio local**: panel para que los emprendedores editen su ficha, horarios y promociones
   con check-in ("cupón al llegar").
6. **App nativa**: envolver la PWA con Capacitor para publicar en App Store / Google Play
   (notificaciones al pasar cerca de un lugar, GPS en segundo plano).
7. **Expansión**: importar región por región con `importar_osm.py` y alianzas con municipios.

## Créditos

Mapas © OpenStreetMap contributors, © CARTO; imágenes satelitales © Esri.
Leaflet © Volodymyr Agafonkin (BSD-2).
