import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eventFormatLabels, eventModalityLabels } from "@/content/community";
import { EventDate } from "@/components/community/EventCard";
import { EventRegistration } from "@/components/community/EventRegistration";
import { CalendarIcon, PinIcon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/JsonLd";
import { Breadcrumbs, DemoBadge } from "@/components/ui/primitives";
import { formatEventDate, formatTime } from "@/lib/dates";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { getViewer } from "@/server/auth/session";
import { getEvent } from "@/server/services/events";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEvent(slug, null);
  if (!e) return { title: "Evento no encontrado" };
  return pageMetadata({ title: e.title, description: e.summary, path: `/comunidad/eventos/${slug}`, noindex: e.isDemo });
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const viewer = await getViewer();
  const e = await getEvent(slug, viewer);
  if (!e) notFound();
  const path = `/comunidad/eventos/${slug}`;
  const filled = Math.min(100, Math.round((e.registeredCount / e.capacity) * 100));
  const attendanceMode = { online: "OnlineEventAttendanceMode", presencial: "OfflineEventAttendanceMode", hibrida: "MixedEventAttendanceMode" }[e.modality];

  return (
    <>
      {!e.isDemo && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Event",
            name: e.title,
            description: e.summary,
            startDate: e.startsAt,
            endDate: e.endsAt,
            eventStatus: e.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
            eventAttendanceMode: `https://schema.org/${attendanceMode}`,
            location: e.modality === "online" ? { "@type": "VirtualLocation", url: absoluteUrl(path) } : { "@type": "Place", name: e.location ?? "Por confirmar" },
            organizer: { "@type": "Organization", name: e.organizer },
            maximumAttendeeCapacity: e.capacity,
            remainingAttendeeCapacity: e.spotsLeft,
            url: absoluteUrl(path),
          }}
        />
      )}
      <div className="container" style={{ paddingBlock: "var(--space-7) var(--space-10)" }}>
        <Breadcrumbs items={[{ name: "Comunidad", href: "/comunidad" }, { name: "Eventos", href: "/comunidad/eventos" }, { name: e.title }]} />
        <div className="community-layout">
          <article className="stack stack--lg">
            <div className="cluster" style={{ alignItems: "flex-start", ["--cluster-gap" as string]: "1.25rem" }}>
              <EventDate iso={e.startsAt} timezone={e.timezone} />
              <div className="stack" style={{ flex: "1 1 300px" }}>
                <div className="card__meta">
                  <span className="badge badge--accent">{eventFormatLabels[e.format]}</span>
                  <span>{eventModalityLabels[e.modality]}</span>
                  {e.isDemo && <DemoBadge label="Evento de ejemplo" />}
                </div>
                <h1 className="h1" style={{ fontSize: "clamp(2rem, 1.5rem + 2vw, 3rem)" }}>
                  {e.title}
                </h1>
                <p className="lead">{e.summary}</p>
              </div>
            </div>
            <div className="thread-body">{e.description}</div>
          </article>

          <aside className="panel stack" aria-label="Detalles e inscripción" style={{ alignSelf: "start" }}>
            <dl className="spec-table" style={{ borderTop: 0 }}>
              <div>
                <dt>Fecha</dt>
                <dd style={{ textTransform: "capitalize" }}>{formatEventDate(e.startsAt, e.timezone)}</dd>
              </div>
              <div>
                <dt>Término</dt>
                <dd>
                  {formatTime(e.endsAt, e.timezone)} ({e.timezone})
                </dd>
              </div>
              <div>
                <dt>Modalidad</dt>
                <dd>{eventModalityLabels[e.modality]}</dd>
              </div>
              <div>
                <dt>{e.modality === "online" ? "Enlace" : "Ubicación"}</dt>
                <dd>
                  {e.modality === "online" ? (
                    e.viewerRegistered && e.onlineUrl ? (
                      <a href={e.onlineUrl} target="_blank" rel="noopener noreferrer">
                        Unirse a la sesión
                      </a>
                    ) : (
                      "Se envía a las personas inscritas"
                    )
                  ) : (
                    <span className="cluster" style={{ ["--cluster-gap" as string]: "0.3rem" }}>
                      <PinIcon size={14} /> {e.location}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Organiza</dt>
                <dd>{e.organizer}</dd>
              </div>
            </dl>
            <div className="capacity">
              <div className="cluster small" style={{ justifyContent: "space-between" }}>
                <span>{e.registeredCount} inscritos</span>
                <span className="muted">{e.spotsLeft} cupos disponibles</span>
              </div>
              <div className="capacity__bar" role="progressbar" aria-valuemin={0} aria-valuemax={e.capacity} aria-valuenow={e.registeredCount} aria-label="Cupos ocupados">
                <div className="capacity__fill" style={{ width: `${filled}%` }} />
              </div>
            </div>
            <EventRegistration
              eventId={e.id}
              registered={e.viewerRegistered}
              spotsLeft={e.spotsLeft}
              isPast={e.isPast}
              cancelled={e.status === "cancelled"}
              isLoggedIn={Boolean(viewer)}
              verified={Boolean(viewer?.user.emailVerifiedAt)}
              path={path}
            />
            <a href={`${path}/calendario`} className="link-arrow small" download>
              <CalendarIcon size={14} /> Añadir a mi calendario (.ics)
            </a>
            <Link href="/comunidad/eventos" className="xsmall">
              ← Todos los eventos
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
