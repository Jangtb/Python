# Modelo de datos

Fuente de verdad en código: `src/server/store/types.ts`. Equivalente SQL: `supabase/migrations/0001_init.sql`.

| Entidad | Propósito | Campos clave |
|---|---|---|
| **User** | Credenciales y rol | email, passwordHash (scrypt), role (`member`/`moderator`/`admin`), status, emailVerifiedAt, trustLevel (0 = nuevo, 1 = confiable) |
| **Profile** | Datos públicos del miembro | handle, displayName, bio, specialty, interests, organization (opcional), links |
| **Session** | Sesión iniciada | id = sha256 del token de la cookie, expiresAt (30 días) |
| **OneTimeToken** | Verificación de correo, restablecimiento, confirmación de boletín | id = sha256 del token, purpose, subject, expiresAt, usedAt |
| **Thread** | Discusión o propuesta | kind, title, body, categorySlug, tags, proposalType, status (`open`/`discussion`/`resolved`/`archived`), moderation (`published`/`pending`/`hidden`/`rejected`), solutionCommentId, locked, isDemo |
| **Comment** | Respuesta | threadId, authorId, body, moderation, isDemo |
| **Vote** | Voto/apoyo (uno por persona) | threadId, userId |
| **CommunityEvent** | Evento | slug, format, modality, startsAt/endsAt (UTC), timezone (IANA), location, onlineUrl, capacity, status |
| **Registration** | Inscripción | eventId, userId, status (`confirmed`/`cancelled`) |
| **Report** | Reporte de contenido | targetType, targetId, reason, details, status |
| **ContactRequest** | Solicitud comercial | name, organization, email, type, message, budget, contactPreference, reference, status |
| **Subscriber** | Boletín | email, status (`pending`/`confirmed`/`unsubscribed`), consentText, consentAt, unsubscribeTokenHash |
| **AuditEntry** | Registro de moderación | actorId, action, targetType, targetId, note |
| **OutboxEmail** | Bitácora de correos enviados o retenidos localmente | to, subject, delivered (`resend`/`local`) |

Categorías, tipos de propuesta y motivos de reporte son configuración (`src/content/community.ts`); en SQL, `categories` es una tabla.

## Reglas que el modelo hace cumplir

- Tokens y sesiones se guardan **hasheados**; nunca en claro.
- Ninguna vista pública expone el correo de un miembro.
- Visibilidad: `published` es público; `pending`/`hidden`/`rejected` solo para autor y moderación.
- Una cuenta pasa a `trustLevel = 1` cuando moderación aprueba una de sus publicaciones o comentarios.
- 3 reportes abiertos de personas distintas → `hidden` preventivo.
- Marcar solución → `status = resolved`; quitarla → vuelve a `discussion`.

## Ejecutar la prueba de RLS

Con un PostgreSQL 16 local (sin Supabase):

```bash
createdb dcd_rls
psql -d dcd_rls -v ON_ERROR_STOP=1 -f supabase/tests/00_supabase_stub.sql -f supabase/migrations/0001_init.sql -f supabase/tests/01_rls_smoke.sql
```

Cada verificación imprime `OK: …`; una violación aborta con `FALLO: …`.
