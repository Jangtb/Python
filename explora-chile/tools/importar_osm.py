#!/usr/bin/env python3
"""Importa lugares de OpenStreetMap (Overpass API) para cualquier comuna de Chile.

Genera web/data/<region>/<slug>.geojson y registra la comuna en
web/data/regiones.json, dejándola disponible en la app. Es la herramienta
para escalar de Pucón al resto del país.

Ejemplos:
    python tools/importar_osm.py --comuna "Pucón" --cut 09115 --region-codigo 09
    python tools/importar_osm.py --comuna "Villarrica" --cut 09120 --region-codigo 09
    python tools/importar_osm.py --comuna "Valdivia" --cut 14101 --region-codigo 14 --mezclar

--mezclar conserva los registros existentes que no vienen de OSM (semilla,
comunidad) y reemplaza solo los de fuente "osm".
"""
from __future__ import annotations

import argparse
import json
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DATA = RAIZ / "web" / "data"
OVERPASS = "https://overpass-api.de/api/interpreter"

# (clave, valor) de OSM -> (categoria, subcategoria). Se evalúan en orden.
MAPEO = [
    (("tourism", "attraction"), ("turistico", "atractivo")),
    (("tourism", "viewpoint"), ("turistico", "mirador")),
    (("tourism", "museum"), ("turistico", "museo")),
    (("natural", "beach"), ("turistico", "playa")),
    (("waterway", "waterfall"), ("turistico", "cascada")),
    (("natural", "volcano"), ("turistico", "volcan")),
    (("natural", "hot_spring"), ("turistico", "termas")),
    (("leisure", "park"), ("turistico", "plaza")),
    (("boundary", "national_park"), ("turistico", "parque_nacional")),
    (("craft", None), ("emprendimiento", "artesania")),
    (("shop", "craft"), ("emprendimiento", "artesania")),
    (("shop", "farm"), ("emprendimiento", "productos_locales")),
    (("shop", "honey"), ("emprendimiento", "productos_locales")),
    (("amenity", "marketplace"), ("emprendimiento", "productos_locales")),
    (("amenity", "cafe"), ("negocio", "cafe")),
    (("amenity", "restaurant"), ("negocio", "restaurante")),
    (("tourism", "hotel"), ("negocio", "hospedaje")),
    (("tourism", "hostel"), ("negocio", "hospedaje")),
    (("tourism", "guest_house"), ("negocio", "hospedaje")),
    (("tourism", "camp_site"), ("negocio", "hospedaje")),
    (("shop", "rental"), ("negocio", "arriendo")),
    (("amenity", "bicycle_rental"), ("negocio", "arriendo")),
    (("shop", None), ("negocio", "tienda")),
]


def consulta(comuna: str) -> str:
    # Busca la comuna por nombre (admin_level 8 = comuna en Chile) dentro de Chile.
    nombre = comuna.replace('"', "")
    return f"""
[out:json][timeout:180];
area["ISO3166-1"="CL"][admin_level=2]->.chile;
area["name"="{nombre}"]["boundary"="administrative"]["admin_level"="8"](area.chile)->.c;
(
  nwr["tourism"~"attraction|viewpoint|museum|hotel|hostel|guest_house|camp_site"](area.c);
  nwr["natural"~"beach|volcano|hot_spring"]["name"](area.c);
  nwr["waterway"="waterfall"](area.c);
  nwr["leisure"="park"]["name"](area.c);
  nwr["amenity"~"cafe|restaurant|marketplace|bicycle_rental"](area.c);
  nwr["shop"](area.c);
  nwr["craft"](area.c);
  way["highway"~"path|footway|track"]["name"](area.c);
  relation["route"="hiking"](area.c);
);
out center geom tags;
"""


def slugify(t: str) -> str:
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return "-".join("".join(c if c.isalnum() else " " for c in t).split())


def clasificar(tags: dict) -> tuple[str, str] | None:
    if tags.get("route") == "hiking" or (tags.get("highway") in {"path", "footway", "track"}):
        return "sendero", "trekking"
    for (k, v), destino in MAPEO:
        if k in tags and (v is None or tags[k] == v):
            return destino
    return None


def geometria(el: dict) -> dict | None:
    if el["type"] == "node":
        return {"type": "Point", "coordinates": [el["lon"], el["lat"]]}
    if el["type"] == "way" and el.get("geometry"):
        coords = [[p["lon"], p["lat"]] for p in el["geometry"]]
        if el.get("tags", {}).get("highway") or len(coords) < 4 or coords[0] != coords[-1]:
            return {"type": "LineString", "coordinates": coords}
    if el["type"] == "relation" and el.get("tags", {}).get("route") == "hiking" and el.get("members"):
        coords = [[p["lon"], p["lat"]] for m in el["members"] if m.get("type") == "way" for p in m.get("geometry", [])]
        if coords:
            return {"type": "LineString", "coordinates": coords}
    if "center" in el:
        return {"type": "Point", "coordinates": [el["center"]["lon"], el["center"]["lat"]]}
    return None


def a_feature(el: dict, slug: str) -> dict | None:
    tags = el.get("tags", {})
    nombre = tags.get("name")
    clase = clasificar(tags)
    geom = geometria(el)
    if not nombre or not clase or not geom:
        return None
    cat, sub = clase
    props = {
        "id": f"{slug}-osm-{el['type'][0]}{el['id']}",
        "nombre": nombre,
        "categoria": cat,
        "subcategoria": sub,
        "descripcion": tags.get("description") or tags.get("description:es"),
        "direccion": " ".join(filter(None, [tags.get("addr:street"), tags.get("addr:housenumber")])) or None,
        "telefono": tags.get("phone") or tags.get("contact:phone"),
        "web": tags.get("website") or tags.get("contact:website"),
        "horario": tags.get("opening_hours"),
        "dificultad": {"hiking": "baja", "mountain_hiking": "media", "demanding_mountain_hiking": "alta",
                       "alpine_hiking": "alta"}.get(tags.get("sac_scale", "")),
        "fuente": "osm",
        "osm": f"{el['type']}/{el['id']}",
        "verificado": False,
    }
    return {"type": "Feature", "geometry": geom, "properties": {k: v for k, v in props.items() if v is not None}}


def descargar(comuna: str) -> list[dict]:
    datos = urllib.parse.urlencode({"data": consulta(comuna)}).encode()
    req = urllib.request.Request(OVERPASS, data=datos, headers={"User-Agent": "explora-chile-importer/1.0"})
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.load(r)["elements"]


def centro(features: list[dict]) -> list[float] | None:
    pts = [f["geometry"]["coordinates"] for f in features if f["geometry"]["type"] == "Point"]
    if not pts:
        return None
    lngs, lats = sorted(p[0] for p in pts), sorted(p[1] for p in pts)
    return [round(lats[len(lats) // 2], 5), round(lngs[len(lngs) // 2], 5)]  # mediana: robusta a outliers


def registrar(indice_ruta: Path, region_codigo: str, comuna: dict) -> None:
    indice = json.loads(indice_ruta.read_text(encoding="utf-8"))
    region = next((r for r in indice["regiones"] if r["codigo"] == region_codigo), None)
    if region is None:
        sys.exit(f"Región {region_codigo} no existe en regiones.json")
    previa = next((c for c in region["comunas"] if c["cut"] == comuna["cut"]), None)
    if previa:
        previa.update({k: v for k, v in comuna.items() if v is not None})
    else:
        region["comunas"].append(comuna)
        region["comunas"].sort(key=lambda c: c["nombre"])
    indice_ruta.write_text(json.dumps(indice, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--comuna", required=True, help='Nombre oficial en OSM, ej. "Pucón"')
    ap.add_argument("--cut", required=True, help="Código Único Territorial de 5 dígitos, ej. 09115")
    ap.add_argument("--region-codigo", required=True, help="Código de región en regiones.json, ej. 09")
    ap.add_argument("--carpeta", help="Subcarpeta de data/ (por defecto, slug de la región)")
    ap.add_argument("--entrada", help="Usar un JSON de Overpass ya descargado en vez de consultar la red")
    ap.add_argument("--mezclar", action="store_true", help="Conservar registros no-OSM existentes")
    args = ap.parse_args()

    indice_ruta = DATA / "regiones.json"
    indice = json.loads(indice_ruta.read_text(encoding="utf-8"))
    region = next((r for r in indice["regiones"] if r["codigo"] == args.region_codigo), None)
    if region is None:
        sys.exit(f"Región {args.region_codigo} no existe en regiones.json")
    carpeta = args.carpeta or slugify(region["nombre"]).removeprefix("la-").split("-")[0]
    slug = slugify(args.comuna)

    if args.entrada:
        elementos = json.loads(Path(args.entrada).read_text(encoding="utf-8"))["elements"]
    else:
        print(f"Consultando Overpass para {args.comuna}…")
        elementos = descargar(args.comuna)

    vistos, features = set(), []
    for el in elementos:
        f = a_feature(el, slug)
        if f and f["properties"]["id"] not in vistos:
            vistos.add(f["properties"]["id"])
            features.append(f)

    salida = DATA / carpeta / f"{slug}.geojson"
    salida.parent.mkdir(parents=True, exist_ok=True)
    if args.mezclar and salida.exists():
        previos = json.loads(salida.read_text(encoding="utf-8")).get("features", [])
        features = [f for f in previos if f["properties"].get("fuente") != "osm"] + features

    geo = {
        "type": "FeatureCollection",
        "metadata": {"comuna": args.comuna, "cut": args.cut, "region": args.region_codigo,
                     "generado": date.today().isoformat(),
                     "nota": "Datos © OpenStreetMap contributors (ODbL). Requieren verificación en terreno."},
        "features": features,
    }
    salida.write_text(json.dumps(geo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    c = centro(features)
    registrar(indice_ruta, args.region_codigo, {
        "cut": args.cut, "nombre": args.comuna, "slug": slug, "centro": c, "zoom": 15,
        "archivo": f"data/{carpeta}/{slug}.geojson", "disponible": bool(features and c),
    })
    resumen = {}
    for f in features:
        resumen[f["properties"]["categoria"]] = resumen.get(f["properties"]["categoria"], 0) + 1
    print(f"{len(features)} lugares → {salida.relative_to(RAIZ)}  {resumen}")


if __name__ == "__main__":
    main()
