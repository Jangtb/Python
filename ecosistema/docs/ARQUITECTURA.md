# Arquitectura

## Stack y decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19** | Renderizado en servidor y estático en una sola app, Server Actions para formularios que funcionan sin JavaScript, metadata/sitemap/robots nativos para SEO. |
| Lenguaje | **TypeScript estricto** (`strict`, `noUncheckedIndexedAccess`) | El contenido y el modelo de datos se validan en compilación. |
| Estilos | **CSS con tokens** (sin framework de UI) | Identidad propia, cero dependencias de estilo, control total del sistema visual. |
| Validación | **Zod 4** | Un mismo esquema valida formularios y entradas de servicios. |
| Datos | **Adaptador local (JSON)** hoy · **PostgreSQL/Supabase** como destino | Funciona sin credenciales; el esquema SQL con RLS está escrito y probado. |
| Autenticación | **Propia en modo demostración** (scrypt + sesiones opacas) | Permite verificar todo el flujo sin proveedor. Al migrar, Supabase Auth reemplaza `services/accounts.ts`. |
| CMS | **Contrato `ContentSource`** con fuente local; **Sanity recomendado** | Ver sección CMS. |
| Correo | **Resend** (API HTTP) con bandeja local de respaldo | Simple, sin SDK, buen soporte de dominios propios. |
| Boletín | **Doble opt-in propio** + sincronización con **Brevo** | El consentimiento queda registrado en la base del sitio; Brevo solo recibe confirmados. |
| Agenda | **URL configurable** (Cal.com u otro) | Sin incrustar scripts de terceros; enlace directo a horarios disponibles. |
| Analítica | **Plausible** | Sin cookies ni datos personales: no requiere banner de consentimiento. |

## Estructura

```
ecosistema/
├─ src/
│  ├─ app/                 Rutas (páginas, layouts, route handlers, sitemap, robots, OG)
│  ├─ components/
│  │  ├─ layout/           Header + mega menú, navegación móvil, sub-navegación, footer, auth shell
│  │  ├─ ui/               Primitivas (breadcrumbs, hero, estados vacíos, avatar, iconos, JSON-LD)
│  │  ├─ editorial/        Tarjetas de artículo, cuerpo, texto enriquecido, YouTube diferido, compartir
│  │  ├─ consulting/       Retrato con estado provisional
│  │  ├─ community/        Filas de conversación, votos, comentarios, reportes, eventos, moderación
│  │  ├─ forms/            Campos accesibles, antispam, formularios de contacto/boletín/cuenta/eventos
│  │  └─ diagrams/         Diagramas editoriales SVG
│  ├─ content/             Contenido editorial tipado (artículos, servicios, talleres, categorías)
│  ├─ config/              site.ts (público), env.ts (servidor), navigation.ts (arquitectura de información)
│  ├─ lib/                 Utilidades puras: contenido, fechas, SEO, texto, analítica
│  ├─ validation/          Esquemas Zod
│  ├─ styles/              tokens.css · base.css · components.css
│  └─ server/              Solo servidor ("server-only")
│     ├─ auth/             Criptografía y sesión
│     ├─ store/            Modelo de datos, adaptador local, datos de ejemplo
│     ├─ services/         Reglas de negocio y autorización (cuentas, comunidad, eventos, captación)
│     ├─ integrations/     Resend, Brevo
│     ├─ actions/          Server Actions (capa delgada: valida → antispam → servicio)
│     └─ antispam.ts
├─ supabase/               Migración SQL con RLS y prueba de políticas
├─ tests/                  unit/ (Vitest) · e2e/ (Playwright + axe-core)
└─ docs/
```

### Flujo de una acción

```
Formulario (client, useActionState)
  → Server Action (src/server/actions)       valida con Zod, honeypot, tiempo mínimo, Turnstile, límites por IP
    → Servicio (src/server/services)          permisos, reglas de negocio, límites por usuario, moderación
      → Almacén (src/server/store)            transacción serializada y escritura atómica
  ← ActionState { status, message, fieldErrors, values }
```

Las integraciones nunca se llaman desde componentes visuales. La autorización se verifica **en los servicios**, no solo en la interfaz: un guard de layout no basta porque en App Router el layout y la página se renderizan en paralelo, por eso cada página privada llama también a su propio guard.

## Sistema de diseño

**Tokens** (`src/styles/tokens.css`): paleta base, derivados accesibles, semánticos, escala tipográfica fluida, espaciado de base 4 px, radios, sombras, movimiento y breakpoints de referencia (640 / 880 / 1120 / 1360 px).

- **Color.** Predominan blanco editorial, gris muy claro y grafito; el azul es acento. Se agregaron dos derivados para cumplir AA: `#55626F` (texto secundario, ≥5,6:1 sobre `#F7F8FA`) y `#2E6890` (enlaces). `#697786` se reserva para texto grande o decorativo porque sobre el fondo editorial no alcanza 4,5:1.
- **Matices por iniciativa** con `data-brand`: DCD usa fondo cálido (`Warm Neutral`) y azul tecnológico; Consultoría, Deep Navy y secciones oscuras; Comunidad, tintes de Soft Blue.
- **Tipografía.** Space Grotesk (titulares con personalidad), Manrope (títulos de componentes y navegación), Inter (lectura), IBM Plex Mono (etiquetas y metadatos). Escala con `clamp()` para móvil.
- **Firma visual.** Grilla fina de fondo, índices monoespaciados ("01", "Paso 2") y **diagramas que explican** (secuencia de una petición web, capas de nube, probabilidades de tokens, DIKW, medallion, ciclo de gobierno, ciclo del ecosistema) en lugar de ilustraciones genéricas.

**Componentes**: header con mega menú (disclosure accesible, Escape, clic externo), navegación móvil sobre `<dialog>`, sub-navegación por iniciativa, heroes, tarjetas editoriales (destacada, estándar, fila), tarjetas de servicio/taller, filas de conversación, botón de voto optimista, comentarios con solución, tarjetas de evento con bloque de fecha, barra de cupos, métricas, formularios, CTA, footer, estados vacíos, error, carga y modo demostración.

## CMS

El contenido editorial pasa por la interfaz `ContentSource` (`src/lib/content.ts`). Hoy la implementa una fuente local tipada; ninguna página importa los archivos de contenido directamente para listar artículos o talleres.

**Recomendación: Sanity.** Plan gratuito suficiente para el volumen esperado, estudio editorial hospedado, esquemas en código (coherentes con los tipos actuales), contenido estructurado tipo *Portable Text* que encaja con `ArticleBlock`, y webhooks para revalidar. Strapi y Directus exigen operar un servidor y una base propios; WordPress headless agrega una superficie de mantenimiento y seguridad mayor de la necesaria.

Para conectarlo: crear esquemas `article`, `pillar`, `workshop`, `serviceGroup`; implementar `ContentSource` con consultas GROQ; mapear Portable Text a `ArticleBlock`; agregar un route handler de webhook que llame a `revalidatePath`. **Pendiente: no implementado.**

## Migración a Supabase

El esquema `supabase/migrations/0001_init.sql` replica el modelo de `src/server/store/types.ts` y traslada a RLS las reglas de los servicios (autopublicación solo para miembros de confianza, contenido pendiente privado, sin escalada de rol, inscripción con control de cupos mediante función atómica, enlace de conexión solo para inscritos). Se validó aplicándolo en PostgreSQL 16 con una simulación de `auth` y ejecutando `supabase/tests/01_rls_smoke.sql`.

Pasos para migrar (pendiente):
1. Crear el proyecto Supabase y aplicar la migración.
2. Reemplazar `services/accounts.ts` y `auth/session.ts` por Supabase Auth (`@supabase/ssr`), que aporta verificación de correo, recuperación y OAuth.
3. Reimplementar las consultas de `services/community.ts`, `events.ts` y `leads.ts` con el cliente de Supabase, manteniendo sus firmas. Las páginas y acciones no cambian.
4. Usar la clave de servicio solo en el servidor para contacto y boletín.
