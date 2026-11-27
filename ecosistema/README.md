# Ecosistema Datos con Datos

Web unificada que conecta tres iniciativas:

- **Datos con Datos (DCD)** — divulgación tecnológica: *explica*.
- **Consultoría** — estrategia, arquitectura y gobierno de datos: *asesora*.
- **Comunidad de Datos** — desafíos, propuestas y eventos entre profesionales: *conecta*.

Next.js 16 · React 19 · TypeScript estricto · CSS con tokens · Zod. Funciona completo en **modo demostración** sin credenciales; cada integración se activa con variables de entorno.

## Ejecutar localmente

```bash
cd ecosistema
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Abre <http://localhost:3000>. La primera ejecución crea `.data/db.json` con contenido de ejemplo **marcado como «Ejemplo»** en la interfaz.

Para tener acceso de administración, define `ADMIN_EMAILS=tu@correo` en `.env.local` y regístrate con ese correo. Sin proveedor de correo, en desarrollo los enlaces de verificación se muestran en pantalla.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm test` | Pruebas unitarias de servicios (Vitest) |
| `npm run test:e2e` | Flujos end-to-end + auditoría WCAG con axe (requiere servidor en marcha, ver `tests/e2e/smoke.mjs`) |

## Rutas

| Ruta | Contenido |
|---|---|
| `/` | Inicio del ecosistema |
| `/datos-con-datos` · `/articulos` · `/articulos/[slug]` · `/recursos` · `/sobre-nosotros` | Portal editorial |
| `/consultoria` · `/servicios` · `/talleres` · `/talleres/[slug]` · `/experiencia` | Marca personal y servicios |
| `/comunidad` · `/discusiones` · `/propuestas` · `/eventos` · `/recursos` · `/miembros/[handle]` · `/normas` | Comunidad |
| `/contacto` | Solicitudes de consultoría, diagnóstico, taller, asesoría o colaboración |
| `/cuenta/*` | Registro, ingreso, verificación, recuperación y perfil |
| `/admin/*` | Resumen, moderación, eventos, solicitudes, miembros y contenido (por rol) |

## Qué funciona y qué está pendiente

**Operativo (probado end-to-end):** navegación y mega menú, búsqueda y filtros de artículos, lectura con índice, fuentes, relacionados y compartir; registro, verificación de correo, ingreso, recuperación de contraseña y perfil; publicar consultas y propuestas con revisión de cuentas nuevas; comentar, votar, marcar solución, reportar y ocultamiento preventivo; inscripción y cancelación en eventos con cupos y archivo `.ics`; formulario de contacto; boletín con doble confirmación y baja; panel de administración y moderación con control por roles; metadata, Open Graph, sitemap, robots y datos estructurados (Article, Person, Event, Course, DiscussionForumPosting, BreadcrumbList).

**Implementado, a la espera de credenciales (no verificado contra los servicios reales):** envío de correo con Resend, sincronización con Brevo, Turnstile, Plausible, agenda en línea, WhatsApp y enlaces a redes.

**Pendiente:** conexión de un CMS (contrato listo, Sanity recomendado), migración de datos y autenticación a Supabase (esquema y RLS listos y probados), contenido real de la marca personal (marcado como provisional), mensajería privada, reputación y notificaciones (fuera del MVP por diseño).

Documentación: [`docs/DIAGNOSTICO.md`](docs/DIAGNOSTICO.md) · [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) · [`docs/MODELO-DE-DATOS.md`](docs/MODELO-DE-DATOS.md) · [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) · variables en [`.env.example`](.env.example).
