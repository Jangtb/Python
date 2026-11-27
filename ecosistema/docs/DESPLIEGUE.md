# Despliegue

## Requisitos

- Node.js 20.9 o superior (probado con 22).
- Para el adaptador local: **un servidor con disco persistente** (VPS, Railway, Render o Fly.io con volumen). El archivo `DATA_DIR/db.json` contiene cuentas y publicaciones: inclúyelo en tus respaldos.
- **Vercel u otra plataforma serverless no sirven con el adaptador local** (sistema de archivos efímero y varias instancias). Para esas plataformas primero hay que completar la migración a Supabase (ver `ARQUITECTURA.md`).

## Pasos (servidor Node con volumen)

```bash
cd ecosistema
npm ci
```

```bash
cp .env.example .env.local
```

Completa en `.env.local` al menos `NEXT_PUBLIC_SITE_URL`, `DATA_DIR` (ruta del volumen), `ADMIN_EMAILS` y, para correos reales, `RESEND_API_KEY`, `EMAIL_FROM` y `CONTACT_INBOX`. Decide `SEED_DEMO` (en producción real se recomienda `false`).

```bash
npm run build
```

```bash
npm start -- -p 3000
```

Pon el proceso detrás de un proxy con HTTPS (Caddy, Nginx o el de la plataforma). El sitio confía en `X-Forwarded-For` para los límites por IP: asegúrate de que el proxy lo sobrescriba.

## Lista de verificación antes de publicar

- [ ] `NEXT_PUBLIC_SITE_URL` apunta al dominio final (se incrusta en el build: recompila si cambia).
- [ ] `EXPOSE_DEV_LINKS` ausente o `false`.
- [ ] Correo configurado y dominio verificado en Resend; probar registro y recuperación de contraseña.
- [ ] Registrarse con un correo de `ADMIN_EMAILS` y comprobar el acceso a `/admin`.
- [ ] Reemplazar el contenido provisional de `src/content/consulting.ts` (nombre, biografía, ubicación, trayectoria, tecnologías, foto) y quitar sus claves de `provisional`.
- [ ] Revisar y completar `/privacidad` con la identidad del responsable y la legislación aplicable.
- [ ] Decidir si se mantienen los datos de ejemplo (`SEED_DEMO`). Si la base ya fue creada, los ejemplos siguen allí: elimina `db.json` antes del primer uso real (con `SEED_DEMO=false` se recrea vacío).
- [ ] Configurar respaldos del directorio `DATA_DIR`.
