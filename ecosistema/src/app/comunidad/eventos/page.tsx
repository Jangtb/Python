import Link from "next/link";
import type { Metadata } from "next";
import { EventCard } from "@/components/community/EventCard";
import { EmptyState, PageHero } from "@/components/ui/primitives";
import { getViewer } from "@/server/auth/session";
import { listEvents } from "@/server/services/events";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Eventos",
  description: "Charlas, workshops, meetups, conversatorios y seminarios de la Comunidad de Datos, online y presenciales.",
  path: "/comunidad/eventos",
});

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const past = ver === "anteriores";
  const viewer = await getViewer();
  const events = await listEvents(past ? "past" : "upcoming", viewer);
  return (
    <>
      <PageHero
        eyebrow="Comunidad de Datos"
        title="Eventos"
        lead="Encuentros para aprender, compartir experiencias y conocer a otras personas que trabajan con datos. Los horarios se muestran en la zona horaria de cada evento."
        breadcrumbs={[{ name: "Comunidad", href: "/comunidad" }, { name: "Eventos" }]}
      />
      <section className="section section--tight">
        <div className="container">
          <nav className="tabs" aria-label="Periodo">
            <Link href="/comunidad/eventos" aria-current={!past ? "page" : undefined}>
              Próximos
            </Link>
            <Link href="/comunidad/eventos?ver=anteriores" aria-current={past ? "page" : undefined}>
              Anteriores
            </Link>
          </nav>
          {events.length ? (
            <div className="grid grid--2">
              {events.map((e) => (
                <EventCard key={e.id} event={e} headingLevel={2} />
              ))}
            </div>
          ) : (
            <EmptyState title={past ? "Todavía no hay eventos anteriores." : "No hay eventos programados por ahora."}>
              ¿Tienes una idea para un encuentro? <Link href="/comunidad/propuestas/nueva">Propónla a la comunidad</Link>.
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
