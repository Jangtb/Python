import type { Metadata } from "next";
import { ThreadListPage, type ListSearch } from "@/components/community/ThreadListPage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Discusiones",
  description: "Desafíos y preguntas reales sobre gobierno, arquitectura, ingeniería, calidad de datos, analítica e IA.",
  path: "/comunidad/discusiones",
});

export default async function Page({ searchParams }: { searchParams: Promise<ListSearch> }) {
  return <ThreadListPage kind="discussion" search={await searchParams} />;
}
