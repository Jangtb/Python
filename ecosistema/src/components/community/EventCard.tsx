import Link from "next/link";
import { eventFormatLabels, eventModalityLabels } from "@/content/community";
import { eventDateParts, formatTime } from "@/lib/dates";
import type { EventView } from "@/server/services/events";
import { DemoBadge } from "@/components/ui/primitives";

export function EventDate({ iso, timezone }: { iso: string; timezone: string }) {
  const p = eventDateParts(iso, timezone);
  return (
    <div className="event-date" aria-hidden="true">
      <span className="event-date__month">{p.month}</span>
      <span className="event-date__day">{p.day}</span>
    </div>
  );
}

export function EventCard({ event, headingLevel = 3 }: { event: EventView; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const p = eventDateParts(event.startsAt, event.timezone);
  return (
    <article className="event-card" data-brand="comunidad">
      <EventDate iso={event.startsAt} timezone={event.timezone} />
      <div className="stack stack--sm">
        <div className="card__meta">
          <span className="badge badge--accent">{eventFormatLabels[event.format]}</span>
          <span>{eventModalityLabels[event.modality]}</span>
          {event.status === "cancelled" && <span className="badge badge--danger">Cancelado</span>}
          {event.isDemo && <DemoBadge />}
        </div>
        <Heading className="h4">
          <Link href={`/comunidad/eventos/${event.slug}`}>{event.title}</Link>
        </Heading>
        <p className="small muted">{event.summary}</p>
        <p className="xsmall muted">
          <time dateTime={event.startsAt}>
            {p.weekday} {p.day} {p.month} · {formatTime(event.startsAt, event.timezone)} ({event.timezone})
          </time>
          {" · "}
          {event.isPast ? "Finalizado" : event.spotsLeft > 0 ? `${event.spotsLeft} cupos disponibles` : "Sin cupos"}
        </p>
      </div>
    </article>
  );
}
