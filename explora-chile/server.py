#!/usr/bin/env python3
"""Servidor de Explora Chile (solo biblioteca estándar de Python).

Sirve la app web (carpeta web/) y una API mínima con SQLite para recibir
check-ins, verificaciones y propuestas de lugares de la comunidad.

    python server.py                    # http://localhost:8000
    EXPLORA_ADMIN_TOKEN=secreto python server.py --puerto 8080

Endpoints:
    GET  /api/salud
    POST /api/eventos                    {"eventos": [...]}   (desde la app)
    GET  /api/lugares?comuna=09115       lugares de la comunidad aprobados (GeoJSON)
    GET  /api/resumen?comuna=09115       verificaciones agregadas por lugar
    GET  /api/moderacion/propuestas      (requiere cabecera X-Admin-Token)
    POST /api/moderacion/aprobar         {"id": 12, "aprobar": true}  (X-Admin-Token)

Para producción a escala nacional se recomienda migrar la misma API a
PostgreSQL + PostGIS (ver README.md); el contrato JSON se mantiene.
"""
from __future__ import annotations

import argparse
import hmac
import json
import os
import re
import sqlite3
import sys
import threading
import time
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

RAIZ = Path(__file__).resolve().parent
WEB = RAIZ / "web"
DB_RUTA = Path(os.environ.get("EXPLORA_DB", RAIZ / "explora.db"))
ADMIN_TOKEN = os.environ.get("EXPLORA_ADMIN_TOKEN", "")

MAX_CUERPO = 512 * 1024
MAX_EVENTOS = 500
TIPOS = {"visita", "reporte", "propuesta"}
ESTADOS_REPORTE = {"existe", "cerrado", "datos_incorrectos", "no_existe"}
CATEGORIAS = {"turistico", "sendero", "emprendimiento", "negocio"}
RE_CUT = re.compile(r"^\d{5}$")

ESQUEMA = """
CREATE TABLE IF NOT EXISTS eventos (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo      TEXT NOT NULL,
    comuna    TEXT NOT NULL,
    lugar     TEXT,
    estado    TEXT,
    datos     TEXT NOT NULL,
    t_cliente INTEGER,
    t_server  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_eventos_comuna ON eventos(comuna, tipo);
CREATE TABLE IF NOT EXISTS lugares_comunidad (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    comuna      TEXT NOT NULL,
    nombre      TEXT NOT NULL,
    categoria   TEXT NOT NULL,
    descripcion TEXT,
    contacto    TEXT,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    estado      TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente | aprobado | rechazado
    creado      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_lugares_comuna ON lugares_comunidad(comuna, estado);
"""

_local = threading.local()


def db() -> sqlite3.Connection:
    con = getattr(_local, "con", None)
    if con is None:
        con = sqlite3.connect(DB_RUTA)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA journal_mode=WAL")
        _local.con = con
    return con


def texto(v, largo: int) -> str:
    return str(v or "").strip()[:largo]


def posicion(v) -> tuple[float, float] | None:
    try:
        lat, lng = float(v[0]), float(v[1])
    except (TypeError, ValueError, IndexError):
        return None
    # Chile continental, insular y antártico aproximado.
    if -90 <= lat <= -17 and -110 <= lng <= -66:
        return lat, lng
    return None


def guardar_eventos(eventos: list) -> int:
    ahora = int(time.time())
    filas, propuestas = [], []
    for ev in eventos[:MAX_EVENTOS]:
        if not isinstance(ev, dict):
            continue
        tipo, comuna = ev.get("tipo"), str(ev.get("comuna", ""))
        if tipo not in TIPOS or not RE_CUT.match(comuna):
            continue
        estado = ev.get("estado") if ev.get("estado") in ESTADOS_REPORTE else None
        try:
            t_cli = int(ev.get("t", 0)) // 1000
        except (TypeError, ValueError):
            t_cli = 0
        datos = json.dumps(ev, ensure_ascii=False)[:4000]
        filas.append((tipo, comuna, texto(ev.get("lugar"), 120) or None, estado, datos, t_cli, ahora))
        if tipo == "propuesta":
            pos = posicion(ev.get("posicion"))
            nombre = texto(ev.get("nombre"), 120)
            if pos and nombre and ev.get("categoria") in CATEGORIAS:
                propuestas.append((comuna, nombre, ev["categoria"], texto(ev.get("descripcion"), 600),
                                   texto(ev.get("contacto"), 200), pos[0], pos[1], ahora))
    con = db()
    with con:
        con.executemany("INSERT INTO eventos(tipo, comuna, lugar, estado, datos, t_cliente, t_server) "
                        "VALUES (?,?,?,?,?,?,?)", filas)
        con.executemany("INSERT INTO lugares_comunidad(comuna, nombre, categoria, descripcion, contacto, lat, lng, creado) "
                        "VALUES (?,?,?,?,?,?,?,?)", propuestas)
    return len(filas)


def lugares_geojson(comuna: str) -> dict:
    filas = db().execute("SELECT * FROM lugares_comunidad WHERE comuna=? AND estado='aprobado'", (comuna,)).fetchall()
    return {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [f["lng"], f["lat"]]},
            "properties": {
                "id": f"comunidad-{f['id']}", "nombre": f["nombre"], "categoria": f["categoria"],
                "descripcion": f["descripcion"], "web": f["contacto"] if str(f["contacto"]).startswith("http") else None,
                "telefono": None if str(f["contacto"]).startswith("http") else f["contacto"],
                "fuente": "comunidad", "verificado": False,
            },
        } for f in filas],
    }


def resumen(comuna: str) -> dict:
    filas = db().execute(
        "SELECT lugar, tipo, estado, COUNT(*) n FROM eventos WHERE comuna=? AND tipo IN ('visita','reporte') "
        "GROUP BY lugar, tipo, estado", (comuna,)).fetchall()
    out: dict[str, dict] = {}
    for f in filas:
        r = out.setdefault(f["lugar"], {"visitas": 0, "reportes": {}})
        if f["tipo"] == "visita":
            r["visitas"] += f["n"]
        else:
            r["reportes"][f["estado"] or "otro"] = f["n"]
    return out


class Manejador(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(WEB), **kw)

    def log_message(self, fmt, *args):  # registros más compactos
        print(f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}")

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    # -- utilidades
    def _json(self, datos, codigo=HTTPStatus.OK):
        cuerpo = json.dumps(datos, ensure_ascii=False).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cuerpo)

    def _cuerpo(self):
        largo = int(self.headers.get("Content-Length") or 0)
        if largo <= 0 or largo > MAX_CUERPO:
            return None
        try:
            return json.loads(self.rfile.read(largo))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    def _es_admin(self) -> bool:
        token = self.headers.get("X-Admin-Token", "")
        return bool(ADMIN_TOKEN) and hmac.compare_digest(token, ADMIN_TOKEN)

    def _comuna(self, qs) -> str | None:
        c = (qs.get("comuna") or [""])[0]
        return c if RE_CUT.match(c) else None

    # -- rutas
    def do_GET(self):
        url = urlparse(self.path)
        if not url.path.startswith("/api/"):
            return super().do_GET()
        qs = parse_qs(url.query)
        if url.path == "/api/salud":
            return self._json({"ok": True})
        if url.path in ("/api/lugares", "/api/resumen"):
            comuna = self._comuna(qs)
            if not comuna:
                return self._json({"error": "comuna inválida (código CUT de 5 dígitos)"}, HTTPStatus.BAD_REQUEST)
            return self._json(lugares_geojson(comuna) if url.path == "/api/lugares" else resumen(comuna))
        if url.path == "/api/moderacion/propuestas":
            if not self._es_admin():
                return self._json({"error": "no autorizado"}, HTTPStatus.UNAUTHORIZED)
            filas = db().execute("SELECT * FROM lugares_comunidad WHERE estado='pendiente' ORDER BY creado").fetchall()
            return self._json([dict(f) for f in filas])
        return self._json({"error": "no encontrado"}, HTTPStatus.NOT_FOUND)

    def do_POST(self):
        url = urlparse(self.path)
        datos = self._cuerpo()
        if not isinstance(datos, dict):
            return self._json({"error": "JSON inválido o demasiado grande"}, HTTPStatus.BAD_REQUEST)
        if url.path == "/api/eventos":
            eventos = datos.get("eventos")
            if not isinstance(eventos, list):
                return self._json({"error": "se esperaba 'eventos': []"}, HTTPStatus.BAD_REQUEST)
            return self._json({"guardados": guardar_eventos(eventos)})
        if url.path == "/api/moderacion/aprobar":
            if not self._es_admin():
                return self._json({"error": "no autorizado"}, HTTPStatus.UNAUTHORIZED)
            estado = "aprobado" if datos.get("aprobar", True) else "rechazado"
            con = db()
            with con:
                n = con.execute("UPDATE lugares_comunidad SET estado=? WHERE id=?", (estado, datos.get("id"))).rowcount
            return self._json({"actualizados": n, "estado": estado})
        return self._json({"error": "no encontrado"}, HTTPStatus.NOT_FOUND)


def main():
    ap = argparse.ArgumentParser(description="Servidor Explora Chile")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--puerto", type=int, default=int(os.environ.get("PORT", 8000)))
    ap.add_argument("--no-abrir", action="store_true", help="No abrir el navegador automáticamente")
    args = ap.parse_args()
    db().executescript(ESQUEMA)
    if not ADMIN_TOKEN:
        print("Aviso: EXPLORA_ADMIN_TOKEN no definido; la moderación queda deshabilitada.")
    try:
        servidor = ThreadingHTTPServer((args.host, args.puerto), Manejador)
    except OSError:
        sys.exit(f"El puerto {args.puerto} está ocupado. ¿Ya tienes la app abierta en otra ventana? "
                 f"Ciérrala o usa: python server.py --puerto 8001")
    url = f"http://localhost:{args.puerto}"
    print("=" * 60)
    print(f"  Explora Chile funcionando en:  {url}")
    print("  Deja esta ventana abierta mientras usas la app.")
    print("  Para apagarla: cierra esta ventana o presiona Ctrl + C")
    print("=" * 60)
    if not args.no_abrir:
        threading.Timer(1.0, webbrowser.open, (url,)).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nApp detenida. ¡Hasta pronto!")


if __name__ == "__main__":
    main()
