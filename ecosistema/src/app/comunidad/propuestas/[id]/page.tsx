import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThreadView } from "@/components/community/ThreadView";
import { JsonLd } from "@/components/ui/JsonLd";
import { getViewer } from "@/server/auth/session";
import { getThread } from "@/server/services/community";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const thread = await getThread(id, null);
  if (!thread || thread.kind !== "proposal") return { title: "Publicación no disponible", robots: { index: false } };
  return pageMetadata({ title: thread.title, description: thread.excerpt, path: `/comunidad/propuestas/${id}`, type: "article", noindex: thread.isDemo });
}

export default async function Page({ params, searchParams }: { params: Params; searchParams: Promise<{ estado?: string }> }) {
  const { id } = await params;
  const { estado } = await searchParams;
  const viewer = await getViewer();
  const thread = await getThread(id, viewer);
  if (!thread || thread.kind !== "proposal") notFound();
  const path = `/comunidad/propuestas/${id}`;
  return (
    <>
      {thread.moderation === "published" && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            headline: thread.title,
            text: thread.body,
            datePublished: thread.createdAt,
            url: absoluteUrl(path),
            author: { "@type": "Person", name: thread.author.displayName },
            commentCount: thread.commentCount,
          }}
        />
      )}
      <ThreadView thread={thread} viewer={viewer} path={path} flash={estado} />
    </>
  );
}
