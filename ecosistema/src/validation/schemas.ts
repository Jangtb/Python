import { z } from "zod";
import { communityCategories, proposalTypes, reportReasons } from "@/content/community";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .min(min, min <= 1 ? `${label} es obligatorio.` : `${label} debe tener al menos ${min} caracteres.`)
    .max(max, `${label} admite hasta ${max} caracteres.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Admite hasta ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));

export const emailSchema = z
  .string({ error: "Ingresa tu correo." })
  .trim()
  .toLowerCase()
  .min(1, "Ingresa tu correo.")
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email("Ingresa un correo válido."));

export const passwordSchema = z
  .string({ error: "Ingresa una contraseña." })
  .min(10, "La contraseña debe tener al menos 10 caracteres.")
  .max(128, "La contraseña admite hasta 128 caracteres.");

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El usuario debe tener al menos 3 caracteres.")
  .max(30, "El usuario admite hasta 30 caracteres.")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Usa letras minúsculas, números y guiones (sin guion al inicio o final).");

export const registerSchema = z.object({
  displayName: trimmed(2, 60, "El nombre"),
  handle: handleSchema,
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal("on", { error: "Debes aceptar las normas de la comunidad." }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Enlace inválido."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden." });

const categorySlugs = communityCategories.map((c) => c.slug) as [string, ...string[]];
const proposalSlugs = proposalTypes.map((c) => c.slug) as [string, ...string[]];

const tagsSchema = z
  .string()
  .optional()
  .transform((raw) =>
    Array.from(
      new Set(
        (raw ?? "")
          .split(",")
          .map((t) => t.trim().toLowerCase().replace(/\s+/g, " "))
          .filter((t) => t.length >= 2 && t.length <= 30),
      ),
    ).slice(0, 5),
  );

export const threadSchema = z.object({
  title: trimmed(12, 160, "El título"),
  body: trimmed(30, 8000, "La descripción"),
  categorySlug: z.enum(categorySlugs, { error: "Selecciona una categoría." }),
  tags: tagsSchema,
});

export const proposalSchema = threadSchema.extend({
  proposalType: z.enum(proposalSlugs, { error: "Selecciona el tipo de propuesta." }),
});

export const commentSchema = z.object({
  threadId: z.uuid(),
  body: trimmed(2, 4000, "El comentario"),
});

export const reportSchema = z.object({
  targetType: z.enum(["thread", "comment"]),
  targetId: z.uuid(),
  reason: z.enum(reportReasons.map((r) => r.value) as [string, ...string[]], { error: "Selecciona un motivo." }),
  details: z.string().trim().max(500, "Admite hasta 500 caracteres.").optional().default(""),
});

const urlSchema = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^https:\/\/[^\s]+\.[^\s]+$/i.test(v), "Usa un enlace https:// válido.");

export const profileSchema = z.object({
  displayName: trimmed(2, 60, "El nombre"),
  bio: z.string().trim().max(600, "La biografía admite hasta 600 caracteres.").default(""),
  specialty: z.string().trim().max(80, "Admite hasta 80 caracteres.").default(""),
  interests: tagsSchema,
  organization: optionalText(80),
  linkedin: z.union([z.literal(""), urlSchema]).optional(),
  website: z.union([z.literal(""), urlSchema]).optional(),
});

export const contactTypes = [
  { value: "consultoria", label: "Consultoría" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "taller", label: "Taller" },
  { value: "asesoria", label: "Asesoría" },
  { value: "colaboracion", label: "Colaboración" },
  { value: "general", label: "Consulta general" },
] as const;

export const contactSchema = z.object({
  name: trimmed(2, 80, "El nombre"),
  organization: optionalText(120),
  email: emailSchema,
  type: z.enum(contactTypes.map((t) => t.value) as [string, ...string[]], { error: "Selecciona el tipo de solicitud." }),
  message: trimmed(20, 4000, "La descripción"),
  budget: optionalText(60),
  contactPreference: z.enum(["correo", "videollamada", "whatsapp"], { error: "Selecciona cómo prefieres que te contacte." }),
  reference: optionalText(120),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  consent: z.literal("on", { error: "Necesitamos tu consentimiento para enviarte el boletín." }),
  source: z.string().trim().max(60).optional().default("sitio"),
});

export const eventSchema = z.object({
  title: trimmed(6, 140, "El nombre"),
  summary: trimmed(20, 240, "El resumen"),
  description: trimmed(20, 6000, "La descripción"),
  format: z.enum(["charla", "workshop", "meetup", "conversatorio", "seminario"]),
  modality: z.enum(["online", "presencial", "hibrida"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  durationMinutes: z.coerce.number().int().min(15).max(600),
  timezone: z.string().min(3).max(60),
  location: optionalText(160),
  onlineUrl: z.union([z.literal(""), urlSchema]).optional(),
  organizer: trimmed(2, 80, "El organizador"),
  capacity: z.coerce.number().int().min(1, "Cupos mínimos: 1.").max(5000),
});

/** Convierte errores de Zod en { campo: mensaje } (primer error por campo). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** FormData → objeto plano (solo strings). */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  }
  return out;
}
