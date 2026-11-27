/**
 * Prueba end-to-end de los flujos principales contra un servidor en ejecución.
 *   BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@example.com node tests/e2e/smoke.mjs
 * Requisitos: servidor iniciado con ADMIN_EMAILS que incluya ADMIN_EMAIL, sin
 * proveedor de correo y con EXPOSE_DEV_LINKS=true (los enlaces de verificación
 * se muestran en pantalla; en producción real esta opción debe quedar desactivada).
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSource = require("fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const run = Date.now().toString(36);
const results = [];

async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t });
    console.log(`✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`✗ ${name}\n    ${e.message.split("\n")[0]}`);
  }
}

// Los formularios exigen un tiempo mínimo de llenado (antispam).
const human = (page) => page.waitForTimeout(2700);

async function register(page, { name, handle, email }) {
  await page.goto(`${BASE}/cuenta/registro`);
  await page.fill("#displayName", name);
  await page.fill("#handle", handle);
  await page.fill("#email", email);
  await page.fill("#password", "una frase larga y segura");
  await page.check('input[name="acceptTerms"]');
  await human(page);
  await page.click('button[type="submit"]');
  await page.getByText("Cuenta creada").waitFor();
  const link = await page.getByRole("link", { name: "abrir enlace" }).getAttribute("href");
  assert.ok(link?.includes("/cuenta/verificar?token="), "Debe mostrarse el enlace de verificación en modo demo");
  await page.goto(link);
  await page.click('button:has-text("Confirmar mi correo")');
  await page.getByText("Tu correo quedó confirmado").waitFor();
}

async function axe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    // @ts-ignore
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" ") }));
  });
  if (res.length) throw new Error(`${label}: ${JSON.stringify(res)}`);
}

const browser = await chromium.launch();
const member = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const admin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const visitor = await browser.newContext({ viewport: { width: 390, height: 844 } });
const m = await member.newPage();
const a = await admin.newPage();
const v = await visitor.newPage();
const errors = [];
for (const p of [m, a, v]) p.on("pageerror", (e) => errors.push(e.message));

let threadUrl = "";

await step("Navegación: mega menú se abre y se cierra con Escape", async () => {
  await m.goto(BASE);
  await m.click('button.nav__trigger:has-text("Consultoría")');
  await m.locator("#mega-consultoria").waitFor();
  await m.keyboard.press("Escape");
  await m.locator("#mega-consultoria").waitFor({ state: "detached" });
});

await step("Navegación móvil: menú en <dialog> sin desbordes horizontales", async () => {
  await v.goto(BASE);
  await v.click('button[aria-label="Abrir menú"]');
  await v.locator("dialog.mobile-nav[open]").waitFor();
  await v.click('dialog.mobile-nav a:has-text("Talleres")');
  await v.waitForURL("**/consultoria/talleres");
  const overflow = await v.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.equal(overflow, 0);
});

await step("Búsqueda y filtros de artículos", async () => {
  await v.goto(`${BASE}/datos-con-datos/articulos?q=contraseña`);
  await v.getByRole("status").filter({ hasText: "1 artículo" }).waitFor();
  await v.goto(`${BASE}/datos-con-datos/articulos?q=zzzz`);
  await v.getByText("No encontramos artículos").waitFor();
});

await step("Validación: formulario de contacto vacío muestra errores", async () => {
  await v.goto(`${BASE}/contacto`);
  await human(v);
  await v.click('button:has-text("Enviar solicitud")');
  await v.getByText("Revisa los campos marcados").waitFor();
  assert.equal(await v.locator('[aria-invalid="true"]').count() > 0, true);
});

await step("Contacto: solicitud válida se registra", async () => {
  await v.goto(`${BASE}/contacto?tipo=diagnostico`);
  await v.fill("#name", "Persona de Prueba");
  await v.fill("#email", `contacto-${run}@example.com`);
  await v.fill("#message", "Necesitamos un diagnóstico de madurez de datos para priorizar iniciativas del próximo año.");
  await human(v);
  await v.click('button:has-text("Enviar solicitud")');
  await v.getByText("Solicitud enviada").waitFor();
});

await step("Antispam: el honeypot bloquea envíos automatizados", async () => {
  await v.goto(`${BASE}/contacto`);
  await v.click('input[value="general"]', { force: true });
  await v.fill("#name", "Bot");
  await v.fill("#email", `bot-${run}@example.com`);
  await v.fill("#message", "Mensaje automatizado de prueba con texto suficiente.");
  await v.evaluate(() => ((document.querySelector('input[name="website_url"]')).value = "http://spam"));
  await human(v);
  await v.click('button:has-text("Enviar solicitud")');
  await v.getByText("No pudimos procesar el envío").waitFor();
});

await step("Boletín: suscripción con doble confirmación", async () => {
  await v.goto(`${BASE}/datos-con-datos`);
  await v.fill("#dcd-nl-email", `lector-${run}@example.com`);
  await v.check('input[name="consent"]');
  await human(v);
  await v.click('button:has-text("Suscribirme")');
  await v.getByText("Casi listo").waitFor();
  const link = await v.getByRole("link", { name: "abrir enlace" }).getAttribute("href");
  await v.goto(link);
  await v.click('button:has-text("Confirmar suscripción")');
  await v.getByText("Suscripción confirmada").waitFor();
});

await step("Registro y verificación de correo (miembro)", async () => {
  await register(m, { name: "Miembro Prueba", handle: `miembro-${run}`, email: `miembro-${run}@example.com` });
});

await step("Miembro nuevo: su primera consulta queda en revisión", async () => {
  await m.goto(`${BASE}/comunidad/discusiones/nueva`);
  await m.fill("#title", `¿Cómo documentar el linaje en un equipo pequeño? (${run})`);
  await m.selectOption("#categorySlug", "data-management");
  await m.fill("#tags", "linaje, metadatos");
  await m.fill("#body", "Somos tres personas y no tenemos herramienta de catálogo. ¿Qué mínimo de linaje recomiendan documentar y cómo mantenerlo?");
  await human(m);
  await m.click('button:has-text("Publicar consulta")');
  await m.waitForURL("**/comunidad/discusiones/*?estado=en-revision");
  threadUrl = m.url().split("?")[0];
  await m.getByText("Tu publicación quedó en revisión").waitFor();
});

await step("Visitante no ve publicaciones pendientes", async () => {
  const res = await v.goto(threadUrl);
  assert.equal(res.status(), 404);
});

await step("Permisos: un miembro no accede a /admin", async () => {
  await m.goto(`${BASE}/admin`);
  await m.waitForURL("**/cuenta/perfil?aviso=sin-permisos");
});

await step("Registro de administración (ADMIN_EMAILS) y aprobación en moderación", async () => {
  await register(a, { name: "Admin Prueba", handle: `admin-${run}`, email: ADMIN_EMAIL });
  await a.goto(`${BASE}/admin/moderacion`);
  const card = a.locator("article.card", { hasText: run });
  await card.locator('button:has-text("Aprobar")').click();
  // Al aprobarse, la publicación sale de la cola de pendientes.
  await card.waitFor({ state: "detached" });
});

await step("Tras la aprobación, la consulta es pública", async () => {
  const res = await v.goto(threadUrl);
  assert.equal(res.status(), 200);
});

await step("Comentar, votar y reportar en una conversación existente", async () => {
  await m.goto(`${BASE}/comunidad/discusiones`);
  await m.click('a:has-text("Arquitectura medallion")');
  await m.fill("#comment-body", "Separaría Gold por dominio cuando cada dominio tenga dueño y consumidores propios; antes, una capa compartida es más simple de mantener.");
  await human(m);
  await m.click('button:has-text("Publicar respuesta")');
  await m.getByText("Comentario publicado").waitFor();
  const vote = m.locator("button.vote-button");
  const before = Number(await vote.locator("strong").innerText());
  await vote.click();
  await m.waitForFunction((b) => Number(document.querySelector("button.vote-button strong")?.textContent) === b + 1, before);
  await m.locator("summary:has-text('Reportar')").first().click();
  await m.check('input[value="fuera_de_tema"]');
  await m.click('button:has-text("Enviar reporte")');
  await m.getByText("Gracias por avisar").waitFor();
});

await step("Autor marca una respuesta como solución", async () => {
  await a.goto(threadUrl);
  await a.fill("#comment-body", "Empieza por las tablas que alimentan reportes críticos: origen, transformación y destino, en un documento versionado.");
  await human(a);
  await a.click('button:has-text("Publicar respuesta")');
  await a.getByText("Comentario publicado").waitFor();
  await m.goto(threadUrl);
  await m.click('button:has-text("Marcar como solución")');
  await m.locator(".comment--solution").waitFor();
  await m.locator(".badge--resolved", { hasText: "Resuelto" }).first().waitFor();
});

await step("Propuesta e inscripción/cancelación en evento", async () => {
  await m.goto(`${BASE}/comunidad/eventos/workshop-calidad-de-datos-en-la-practica`);
  await m.click('button:has-text("Inscribirme")');
  await m.getByText("Estás inscrito").waitFor();
  await m.click('button:has-text("Cancelar inscripción")');
  await m.locator('button:has-text("Inscribirme")').waitFor();
});

await step("Administración: solicitud comercial visible y gestionable", async () => {
  await a.goto(`${BASE}/admin/solicitudes`);
  const card = a.locator("article.card", { hasText: `contacto-${run}@example.com` });
  await card.locator('button:has-text("Marcar en curso")').click();
  await card.getByText("En curso").waitFor();
});

await step("Administración: crear un evento", async () => {
  await a.goto(`${BASE}/admin/eventos`);
  await a.fill("#ev-title", `Charla de prueba ${run}`);
  await a.fill("#ev-summary", "Charla breve para validar la creación de eventos desde el panel.");
  await a.fill("#ev-description", "Descripción completa del evento de prueba creado por la suite end-to-end.");
  await a.fill("#ev-date", new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10));
  await a.click('button:has-text("Publicar evento")');
  await a.getByText("Evento publicado").waitFor();
  await v.goto(`${BASE}/comunidad/eventos`);
  await v.getByText(`Charla de prueba ${run}`).waitFor();
});

for (const path of ["/", "/datos-con-datos", "/datos-con-datos/articulos/que-pasa-cuando-abres-una-pagina-web", "/consultoria", "/consultoria/servicios", "/consultoria/talleres/calidad-de-datos-en-la-practica", "/comunidad", "/comunidad/discusiones", "/comunidad/eventos/meetup-datos-santiago", "/contacto", "/cuenta/registro"]) {
  await step(`Accesibilidad (axe, WCAG 2.2 AA): ${path}`, async () => {
    const p = await visitor.newPage();
    await p.goto(`${BASE}${path}`);
    await p.waitForTimeout(900); // termina la animación de entrada
    await axe(p, path);
    await p.close();
  });
}

await step("Sin errores de JavaScript en el navegador", async () => {
  assert.deepEqual(errors, []);
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasos correctos`);
process.exit(failed.length ? 1 : 0);
