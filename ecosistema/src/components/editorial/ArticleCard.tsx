import Link from "next/link";
import type { Article } from "@/content/types";
import { Visual } from "@/components/diagrams/Visual";
import { articleReadingMinutes, pillarName } from "@/lib/content";
import { formatDate } from "@/lib/dates";

export function ArticleMeta({ article }: { article: Article }) {
  return (
    <div className="card__meta">
      <span className="badge badge--accent">{pillarName(article.pillar)}</span>
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      <span className="dot-sep">{articleReadingMinutes(article)} min de lectura</span>
    </div>
  );
}

export function ArticleCard({ article, variant = "default", headingLevel = 3 }: { article: Article; variant?: "default" | "featured" | "row"; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/datos-con-datos/articulos/${article.slug}`;
  return (
    <article className={`article-card${variant !== "default" ? ` article-card--${variant}` : ""}`} data-brand="dcd">
      <div className="article-card__visual">
        <Visual name={article.visual} decorative />
      </div>
      <div className="stack stack--sm">
        {variant !== "row" && <ArticleMeta article={article} />}
        <Heading className="article-card__title">
          <Link href={href}>{article.title}</Link>
        </Heading>
        {variant !== "row" && <p className="article-card__excerpt">{article.excerpt}</p>}
        {variant === "row" && (
          <span className="xsmall muted">
            {pillarName(article.pillar)} · {articleReadingMinutes(article)} min
          </span>
        )}
      </div>
    </article>
  );
}
