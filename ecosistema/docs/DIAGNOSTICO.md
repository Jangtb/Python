# Diagnóstico del repositorio original

Fecha: noviembre de 2026 · Alcance: repositorio `jangtb/python`, rama principal al iniciar el trabajo.

## Qué había

| Ruta | Qué es | Estado |
|---|---|---|
| `VideoGrab.py` | Script de OpenCV que captura video de la cámara y aplica un filtro Sobel. | Independiente; sin relación con el ecosistema. |
| `explora-chile/` | PWA de exploración turística (Leaflet, servidor HTTP en Python, datos GeoJSON) con despliegue en GitHub Pages vía `.github/workflows/publicar-explora-chile.yml`. | Funcional y con su propio flujo de publicación. |
| `.gitignore` | Ignora la base SQLite de Explora Chile y `__pycache__`. | — |

## Conclusiones

- **No existía ninguna aplicación del ecosistema** (Datos con Datos, marca personal ni comunidad): ni código, ni contenido, ni configuración, ni variables de entorno relacionadas.
- **Nada era reutilizable directamente.** Explora Chile resuelve otro problema con otra arquitectura (sitio estático + servidor Python mínimo). Su patrón de "funcionar sin dependencias" inspiró el adaptador de datos local del ecosistema.
- **No se eliminó ni modificó nada existente.** El ecosistema vive en `ecosistema/` y su CI (`ecosistema-ci.yml`) solo se activa con cambios en esa carpeta, por lo que no interfiere con la publicación de Explora Chile.

## Riesgos detectados y cómo se abordaron

| Riesgo | Decisión |
|---|---|
| Sin backend ni credenciales disponibles | Integraciones desacopladas en adaptadores; modo demostración explícito y funcional. |
| Contenido personal inexistente (biografía, foto, trayectoria) | Contenido provisional centralizado en `src/content/consulting.ts`, marcado visualmente en la interfaz. Sin clientes, cifras ni testimonios inventados. |
| Comunidad expuesta a spam | Verificación de correo, revisión de cuentas nuevas, límites por hora, honeypot, tiempo mínimo de llenado, Turnstile opcional, reportes con ocultamiento preventivo. |
| Mezclar proyectos en un mismo repo | Carpeta propia, `package.json` propio, CI con filtro de rutas. |
