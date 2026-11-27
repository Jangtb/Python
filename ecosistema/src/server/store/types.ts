/**
 * Modelo de datos del ecosistema. Refleja 1:1 el esquema PostgreSQL de
 * supabase/migrations/0001_init.sql (snake_case allí, camelCase aquí).
 */

export type Role = "member" | "moderator" | "admin";
export type ISODate = string;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: "active" | "suspended";
  emailVerifiedAt: ISODate | null;
  /** 0 = recién llegado (sus publicaciones requieren revisión), 1 = confiable */
  trustLevel: 0 | 1;
  createdAt: ISODate;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface Profile {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  specialty: string;
  interests: string[];
  organization: string | null;
  links: ProfileLink[];
  updatedAt: ISODate;
}

export interface Session {
  /** sha256 del token de la cookie: el token en claro nunca se almacena */
  id: string;
  userId: string;
  createdAt: ISODate;
  expiresAt: ISODate;
}

export type TokenPurpose = "verify_email" | "reset_password" | "newsletter_confirm";

export interface OneTimeToken {
  id: string; // sha256 del token
  purpose: TokenPurpose;
  subject: string; // userId o subscriberId
  expiresAt: ISODate;
  usedAt: ISODate | null;
  createdAt: ISODate;
}

export type ThreadKind = "discussion" | "proposal";
export type ThreadStatus = "open" | "discussion" | "resolved" | "archived";
export type Moderation = "published" | "pending" | "hidden" | "rejected";

export interface Thread {
  id: string;
  kind: ThreadKind;
  title: string;
  body: string;
  categorySlug: string;
  tags: string[];
  /** Solo propuestas: tipo de iniciativa */
  proposalType: string | null;
  authorId: string;
  status: ThreadStatus;
  moderation: Moderation;
  solutionCommentId: string | null;
  locked: boolean;
  isDemo: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  lastActivityAt: ISODate;
}

export interface Comment {
  id: string;
  threadId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  moderation: Moderation;
  isDemo: boolean;
  createdAt: ISODate;
}

export interface Vote {
  threadId: string;
  userId: string;
  createdAt: ISODate;
}

export type EventFormat = "charla" | "workshop" | "meetup" | "conversatorio" | "seminario";
export type EventModality = "online" | "presencial" | "hibrida";

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  format: EventFormat;
  modality: EventModality;
  startsAt: ISODate;
  endsAt: ISODate;
  timezone: string;
  location: string | null;
  onlineUrl: string | null;
  organizer: string;
  capacity: number;
  status: "published" | "draft" | "cancelled";
  isDemo: boolean;
  createdBy: string | null;
  createdAt: ISODate;
}

export interface Registration {
  eventId: string;
  userId: string;
  status: "confirmed" | "cancelled";
  createdAt: ISODate;
}

export type ReportTarget = "thread" | "comment";

export interface Report {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  reporterId: string;
  reason: "spam" | "abuso" | "fuera_de_tema" | "informacion_personal" | "otro";
  details: string;
  status: "open" | "resolved" | "dismissed";
  resolvedBy: string | null;
  resolvedAt: ISODate | null;
  createdAt: ISODate;
}

export type ContactType = "consultoria" | "diagnostico" | "taller" | "asesoria" | "colaboracion" | "general";

export interface ContactRequest {
  id: string;
  name: string;
  organization: string | null;
  email: string;
  type: ContactType;
  message: string;
  budget: string | null;
  contactPreference: "correo" | "videollamada" | "whatsapp";
  reference: string | null;
  status: "new" | "in_progress" | "closed";
  createdAt: ISODate;
}

export interface Subscriber {
  id: string;
  email: string;
  status: "pending" | "confirmed" | "unsubscribed";
  /** Token permanente de baja (hash). Permite darse de baja sin iniciar sesión. */
  unsubscribeTokenHash: string;
  consentText: string;
  consentAt: ISODate;
  confirmedAt: ISODate | null;
  unsubscribedAt: ISODate | null;
  source: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  note: string | null;
  createdAt: ISODate;
}

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  text: string;
  createdAt: ISODate;
  delivered: "resend" | "local";
}

export interface Database {
  version: number;
  users: User[];
  profiles: Profile[];
  sessions: Session[];
  tokens: OneTimeToken[];
  threads: Thread[];
  comments: Comment[];
  votes: Vote[];
  events: CommunityEvent[];
  registrations: Registration[];
  reports: Report[];
  contactRequests: ContactRequest[];
  subscribers: Subscriber[];
  audit: AuditEntry[];
  outbox: OutboxEmail[];
}

export const emptyDatabase = (): Database => ({
  version: 1,
  users: [],
  profiles: [],
  sessions: [],
  tokens: [],
  threads: [],
  comments: [],
  votes: [],
  events: [],
  registrations: [],
  reports: [],
  contactRequests: [],
  subscribers: [],
  audit: [],
  outbox: [],
});
