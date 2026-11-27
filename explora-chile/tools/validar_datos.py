#!/usr/bin/env python3
"""Valida regiones.json y todos los GeoJSON de comunas disponibles.

    python tools/validar_datos.py

Revisa: categorías válidas, ids únicos, coordenadas dentro de Chile y
geometrías soportadas. Sale con código 1 si hay errores (útil en CI).
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "web" / "data"
CATEGORIAS = {"turistico", "sendero", "emprendimiento", "negocio"}
GEOMETRIAS = {"Point", "LineString", "Polygon"}


def en_chile(lng, lat):
    return -90 <= lat <= -17 and -110 <= lng <= -66


def puntos(g):
    c = g["coordinates"]
    return [c] if g["type"] == "Point" else c if g["type"] == "LineString" else c[0]


def main():
    errores, total = [], 0
    indice = json.loads((DATA / "regiones.json").read_text(encoding="utf-8"))
    cuts = set()
    for r in indice["regiones"]:
        for c in r["comunas"]:
            if c["cut"] in cuts:
                errores.append(f"CUT repetido {c['cut']}")
            cuts.add(c["cut"])
            ruta = DATA.parent / c["archivo"]
            if not c.get("disponible"):
                continue
            if not ruta.exists():
                errores.append(f"{c['nombre']}: falta {c['archivo']}")
                continue
            ids = set()
            for i, f in enumerate(json.loads(ruta.read_text(encoding="utf-8"))["features"]):
                p, g = f.get("properties", {}), f.get("geometry", {})
                donde = f"{c['nombre']} #{i} ({p.get('id')})"
                if p.get("categoria") not in CATEGORIAS:
                    errores.append(f"{donde}: categoría inválida {p.get('categoria')!r}")
                if not p.get("id") or p["id"] in ids:
                    errores.append(f"{donde}: id vacío o repetido")
                ids.add(p.get("id"))
                if not p.get("nombre"):
                    errores.append(f"{donde}: sin nombre")
                if g.get("type") not in GEOMETRIAS:
                    errores.append(f"{donde}: geometría no soportada {g.get('type')}")
                elif not all(en_chile(*pt[:2]) for pt in puntos(g)):
                    errores.append(f"{donde}: coordenadas fuera de Chile (¿lat/lng invertidos?)")
                total += 1
    for e in errores:
        print("ERROR", e)
    print(f"{total} lugares revisados en {len(cuts)} comunas registradas, {len(errores)} errores.")
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
