import type { Metadata } from "next";
import { ThreadListPage, type ListSearch } from "@/components/community/ThreadListPage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Propuestas e iniciativas",
  description: "Ideas de la comunidad para proyectos colaborativos, investigaciones, encuentros, talleres, herramientas y recursos compartidos.",
  path: "/comunidad/propuestas",
});

export default async function Page({ searchParams }: { searchParams: Promise<ListSearch> }) {
  return <ThreadListPage kind="proposal" search={await searchParams} />;
}
