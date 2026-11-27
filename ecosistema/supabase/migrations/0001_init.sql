-- =============================================================================
-- Ecosistema Datos con Datos — esquema PostgreSQL para Supabase
-- Refleja el modelo de src/server/store/types.ts y replica en RLS las reglas
-- de autorización que hoy aplican los servicios de src/server/services.
--
-- ESTADO: listo para aplicar, NO conectado todavía a la aplicación. El
-- adaptador activo es el almacén local (src/server/store/local-store.ts).
-- Ver docs/ARQUITECTURA.md → "Migración a Supabase".
-- =============================================================================

create extension if not exists citext;

-- ---------------------------------------------------------------- Tipos
create type public.member_role      as enum ('member', 'moderator', 'admin');
create type public.thread_kind      as enum ('discussion', 'proposal');
create type public.thread_status    as enum ('open', 'discussion', 'resolved', 'archived');
create type public.moderation_state as enum ('published', 'pending', 'hidden', 'rejected');
create type public.event_format     as enum ('charla', 'workshop', 'meetup', 'conversatorio', 'seminario');
create type public.event_modality   as enum ('online', 'presencial', 'hibrida');
create type public.report_reason    as enum ('spam', 'abuso', 'fuera_de_tema', 'informacion_personal', 'otro');

-- ---------------------------------------------------------------- Perfiles
-- auth.users (Supabase Auth) gestiona correo, contraseña, verificación y OAuth.
create table public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  handle        citext not null unique check (handle ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' and length(handle) between 3 and 30),
  display_name  text not null check (length(display_name) between 2 and 60),
  bio           text not null default '' check (length(bio) <= 600),
  specialty     text not null default '' check (length(specialty) <= 80),
  interests     text[] not null default '{}',
  organization  text check (length(organization) <= 80),
  links         jsonb not null default '[]',
  role          public.member_role not null default 'member',
  trust_level   smallint not null default 0 check (trust_level in (0, 1)),
  suspended     boolean not null default false,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Funciones auxiliares (SECURITY DEFINER para evitar recursión de RLS).
create or replace function public.current_role_name() returns public.member_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() and not suspended
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('moderator', 'admin'), false)
$$;

create or replace function public.is_verified() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from auth.users u join public.profiles p on p.user_id = u.id
    where u.id = auth.uid() and u.email_confirmed_at is not null and not p.suspended
  )
$$;

-- ---------------------------------------------------------------- Categorías y etiquetas
create table public.categories (
  slug        text primary key,
  name        text not null,
  description text not null default ''
);

create table public.tags (
  slug text primary key check (length(slug) between 2 and 30)
);

-- ---------------------------------------------------------------- Publicaciones
create table public.threads (
  id                  uuid primary key default gen_random_uuid(),
  kind                public.thread_kind not null,
  title               text not null check (length(title) between 12 and 160),
  body                text not null check (length(body) between 30 and 8000),
  category_slug       text not null references public.categories (slug),
  proposal_type       text,
  author_id           uuid not null references public.profiles (user_id) on delete cascade,
  status              public.thread_status not null default 'open',
  moderation          public.moderation_state not null default 'pending',
  solution_comment_id uuid,
  locked              boolean not null default false,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  last_activity_at    timestamptz not null default now(),
  constraint proposal_type_only_for_proposals check ((kind = 'proposal') = (proposal_type is not null))
);
create index threads_listing_idx on public.threads (kind, moderation, status, last_activity_at desc);
create index threads_author_idx  on public.threads (author_id, created_at desc);
create index threads_search_idx  on public.threads using gin (to_tsvector('spanish', title || ' ' || body));

create table public.thread_tags (
  thread_id uuid references public.threads (id) on delete cascade,
  tag       text references public.tags (slug),
  primary key (thread_id, tag)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  author_id   uuid not null references public.profiles (user_id) on delete cascade,
  body        text not null check (length(body) between 2 and 4000),
  moderation  public.moderation_state not null default 'published',
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index comments_thread_idx on public.comments (thread_id, created_at);

alter table public.threads
  add constraint threads_solution_fk foreign key (solution_comment_id) references public.comments (id) on delete set null;

create table public.votes (
  thread_id  uuid references public.threads (id) on delete cascade,
  user_id    uuid references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

-- ---------------------------------------------------------------- Eventos
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text not null,
  description  text not null,
  format       public.event_format not null,
  modality     public.event_modality not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at),
  timezone     text not null default 'America/Santiago',
  location     text,
  organizer    text not null,
  capacity     integer not null check (capacity > 0),
  status       text not null default 'published' check (status in ('published', 'draft', 'cancelled')),
  is_demo      boolean not null default false,
  created_by   uuid references public.profiles (user_id),
  created_at   timestamptz not null default now()
);

-- El enlace de conexión vive aparte: solo lo leen inscritos y moderación.
-- (Un REVOKE por columna no basta si el rol tiene SELECT sobre la tabla.)
create table public.event_private (
  event_id   uuid primary key references public.events (id) on delete cascade,
  online_url text
);

create table public.registrations (
  event_id   uuid references public.events (id) on delete cascade,
  user_id    uuid references public.profiles (user_id) on delete cascade,
  status     text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Inscripción atómica con control de cupos.
create or replace function public.register_for_event(p_event uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_capacity int; v_taken int;
begin
  if not public.is_verified() then raise exception 'unverified'; end if;
  select capacity into v_capacity from public.events
   where id = p_event and status = 'published' and starts_at > now() for update;
  if v_capacity is null then raise exception 'not_available'; end if;
  select count(*) into v_taken from public.registrations where event_id = p_event and status = 'confirmed';
  if v_taken >= v_capacity then raise exception 'full'; end if;
  insert into public.registrations (event_id, user_id) values (p_event, auth.uid())
  on conflict (event_id, user_id) do update set status = 'confirmed', created_at = now();
end $$;

-- ---------------------------------------------------------------- Reportes y auditoría
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('thread', 'comment')),
  target_id   uuid not null,
  reporter_id uuid not null references public.profiles (user_id) on delete cascade,
  reason      public.report_reason not null,
  details     text not null default '' check (length(details) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (user_id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index reports_one_open_per_user on public.reports (target_id, reporter_id) where status = 'open';

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (user_id),
  action      text not null,
  target_type text not null,
  target_id   uuid not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- Captación
create table public.contact_requests (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  organization       text,
  email              citext not null,
  type               text not null check (type in ('consultoria', 'diagnostico', 'taller', 'asesoria', 'colaboracion', 'general')),
  message            text not null check (length(message) between 20 and 4000),
  budget             text,
  contact_preference text not null check (contact_preference in ('correo', 'videollamada', 'whatsapp')),
  reference          text,
  status             text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at         timestamptz not null default now()
);

create table public.subscribers (
  id                     uuid primary key default gen_random_uuid(),
  email                  citext not null unique,
  status                 text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  unsubscribe_token_hash text not null,
  consent_text           text not null,
  consent_at             timestamptz not null default now(),
  confirmed_at           timestamptz,
  unsubscribed_at        timestamptz,
  source                 text not null default 'sitio'
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.tags             enable row level security;
alter table public.threads          enable row level security;
alter table public.thread_tags      enable row level security;
alter table public.comments         enable row level security;
alter table public.votes            enable row level security;
alter table public.events           enable row level security;
alter table public.event_private    enable row level security;
alter table public.registrations    enable row level security;
alter table public.reports          enable row level security;
alter table public.audit_log        enable row level security;
alter table public.contact_requests enable row level security;
alter table public.subscribers      enable row level security;

-- Perfiles: lectura pública de campos no sensibles (el correo vive en auth.users).
create policy profiles_read   on public.profiles for select using (not suspended or public.is_staff());
create policy profiles_insert on public.profiles for insert with check (user_id = auth.uid() and role = 'member' and trust_level = 0);
-- Cada persona edita su perfil, pero no puede elevar su rol ni su confianza.
create policy profiles_update on public.profiles for update using (user_id = auth.uid())
  with check (user_id = auth.uid()
              and role = (select role from public.profiles where user_id = auth.uid())
              and trust_level = (select trust_level from public.profiles where user_id = auth.uid()));
create policy profiles_staff  on public.profiles for update using (public.current_role_name() = 'admin');

create policy categories_read on public.categories for select using (true);
create policy tags_read       on public.tags for select using (true);
create policy tags_insert     on public.tags for insert with check (public.is_verified());

-- Publicaciones: públicas si están publicadas; autor y moderación ven el resto.
create policy threads_read on public.threads for select
  using (moderation = 'published' or author_id = auth.uid() or public.is_staff());
-- Al crear: correo verificado; cuentas nuevas entran como 'pending'.
create policy threads_insert on public.threads for insert with check (
  author_id = auth.uid() and public.is_verified() and status = 'open' and not locked and not is_demo
  and (moderation = 'pending'
       or (moderation = 'published' and ((select trust_level from public.profiles where user_id = auth.uid()) = 1 or public.is_staff())))
);
create policy threads_author_update on public.threads for update
  using (author_id = auth.uid() and moderation = 'published')
  with check (author_id = auth.uid() and moderation = 'published' and status in ('open', 'discussion', 'resolved'));
create policy threads_staff on public.threads for all using (public.is_staff()) with check (public.is_staff());

create policy thread_tags_read   on public.thread_tags for select using (true);
create policy thread_tags_insert on public.thread_tags for insert
  with check (exists (select 1 from public.threads t where t.id = thread_id and t.author_id = auth.uid()));

create policy comments_read on public.comments for select
  using (moderation = 'published' or author_id = auth.uid() or public.is_staff());
create policy comments_insert on public.comments for insert with check (
  author_id = auth.uid() and public.is_verified() and moderation in ('published', 'pending') and not is_demo
  and exists (select 1 from public.threads t where t.id = thread_id and t.moderation = 'published' and not t.locked and t.status <> 'archived')
);
create policy comments_staff on public.comments for all using (public.is_staff()) with check (public.is_staff());

create policy votes_read   on public.votes for select using (true);
create policy votes_insert on public.votes for insert with check (
  user_id = auth.uid() and public.is_verified()
  and exists (select 1 from public.threads t where t.id = thread_id and t.moderation = 'published' and t.author_id <> auth.uid())
);
create policy votes_delete on public.votes for delete using (user_id = auth.uid());

-- Eventos: lectura pública, gestión por moderación. El enlace solo para inscritos.
create policy events_read  on public.events for select using (status <> 'draft' or public.is_staff());
create policy events_staff on public.events for all using (public.is_staff()) with check (public.is_staff());
create policy event_private_read on public.event_private for select using (
  public.is_staff() or exists (select 1 from public.registrations r where r.event_id = event_private.event_id and r.user_id = auth.uid() and r.status = 'confirmed')
);
create policy event_private_staff on public.event_private for all using (public.is_staff()) with check (public.is_staff());

create policy registrations_own   on public.registrations for select using (user_id = auth.uid() or public.is_staff());
create policy registrations_cancel on public.registrations for update using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'cancelled');
-- La inscripción se hace solo mediante public.register_for_event() (control de cupos).

create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid() and public.is_verified() and status = 'open');
create policy reports_staff  on public.reports for all using (public.is_staff()) with check (public.is_staff());

create policy audit_staff on public.audit_log for select using (public.is_staff());

-- Contacto y boletín: escritura solo desde el servidor (service role); lectura de administración.
create policy contact_admin on public.contact_requests for all using (public.current_role_name() = 'admin') with check (public.current_role_name() = 'admin');
create policy subscribers_admin on public.subscribers for select using (public.current_role_name() = 'admin');

-- ---------------------------------------------------------------- Datos iniciales
insert into public.categories (slug, name, description) values
  ('gobierno-de-datos', 'Gobierno de Datos', 'Modelos operativos, roles, políticas y estándares.'),
  ('arquitectura-de-datos', 'Arquitectura de Datos', 'Lakehouse, warehouse, modelado e integración.'),
  ('ingenieria-de-datos', 'Ingeniería de Datos', 'Pipelines, orquestación, rendimiento y operación.'),
  ('data-quality', 'Data Quality', 'Reglas, monitoreo, contratos y remediación.'),
  ('analitica-y-bi', 'Analítica y BI', 'Modelos semánticos, visualización y decisiones.'),
  ('inteligencia-artificial', 'Inteligencia Artificial', 'Casos de uso, datos para IA y uso responsable.'),
  ('data-management', 'Data Management', 'Metadatos, catálogo, linaje y datos maestros.'),
  ('seguridad-y-privacidad', 'Seguridad y privacidad', 'Protección de datos, accesos y cumplimiento.'),
  ('estrategia-y-negocio', 'Estrategia y negocio', 'Valor, priorización y adopción.'),
  ('carrera-y-desarrollo', 'Carrera y desarrollo profesional', 'Aprendizaje, roles y crecimiento.'),
  ('eventos-y-networking', 'Eventos y networking', 'Encuentros, comunidades y colaboración.');
