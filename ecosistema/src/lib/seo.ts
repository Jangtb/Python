import type { Metadata } from "next";
import { site } from "@/config/site";

interface PageMeta {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  noindex?: boolean;
}

/** Metadata consistente por página: título, descripción, canonical y Open Graph. */
export function pageMetadata({ title, description, path, type = "website", publishedTime, noindex }: PageMeta): Metadata {
  const url = `${site.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: site.ecosystemName,
      locale: site.locale,
      type,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function absoluteUrl(path: string): string {
  return `${site.url}${path}`;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}
