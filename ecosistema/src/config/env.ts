import "server-only";

/**
 * Variables de entorno del servidor. Nunca importar desde componentes cliente.
 * Cada integración se considera "configurada" solo si tiene todas sus claves.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export const serverEnv = {
  isProduction: process.env.NODE_ENV === "production",
  get adminEmails(): string[] {
    return (read("ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
  /** Muestra enlaces de verificación en pantalla cuando no hay proveedor de correo (solo desarrollo). */
  exposeDevLinks: read("EXPOSE_DEV_LINKS") === "true" || process.env.NODE_ENV !== "production",
  email: {
    resendApiKey: read("RESEND_API_KEY"),
    from: read("EMAIL_FROM"),
    contactInbox: read("CONTACT_INBOX"),
  },
  brevo: {
    apiKey: read("BREVO_API_KEY"),
    listId: read("BREVO_LIST_ID"),
  },
  turnstile: {
    secretKey: read("TURNSTILE_SECRET_KEY"),
  },
};

export const integrations = {
  email: Boolean(serverEnv.email.resendApiKey && serverEnv.email.from),
  brevo: Boolean(serverEnv.brevo.apiKey && serverEnv.brevo.listId),
  turnstile: Boolean(serverEnv.turnstile.secretKey && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
};
