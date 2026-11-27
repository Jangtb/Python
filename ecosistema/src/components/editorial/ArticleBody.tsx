import type { ArticleBlock } from "@/content/types";
import { Visual } from "@/components/diagrams/Visual";
import { RichText } from "./RichText";
import { YouTubeLite } from "./YouTubeLite";

/** `coverVisual`: el diagrama ya mostrado como portada no se repite en el cuerpo. */
export function ArticleBody({ blocks, coverVisual }: { blocks: ArticleBlock[]; coverVisual?: string }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i}>
                <RichText text={b.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} id={b.id}>
                {b.text}
              </h2>
            );
          case "h3":
            return <h3 key={i}>{b.text}</h3>;
          case "ul":
          case "ol": {
            const List = b.type;
            return (
              <List key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <RichText text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "quote":
            return (
              <blockquote key={i}>
                <p>{b.text}</p>
                {b.cite && <cite className="small muted">— {b.cite}</cite>}
              </blockquote>
            );
          case "callout":
            return (
              <aside key={i} className="callout">
                <strong className="callout__title">{b.title}</strong>
                <RichText text={b.text} />
              </aside>
            );
          case "figure":
            if (b.visual === coverVisual) return null;
            return (
              <figure key={i} className="figure">
                <div className="figure__media">
                  <Visual name={b.visual} />
                </div>
                <figcaption>{b.caption}</figcaption>
              </figure>
            );
          case "youtube":
            return (
              <figure key={i} className="figure">
                <YouTubeLite videoId={b.videoId} title={b.title} />
                <figcaption>{b.title}</figcaption>
              </figure>
            );
          case "social":
            return (
              <p key={i}>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="link-arrow">
                  {b.label} <span aria-hidden="true">↗</span>
                </a>
              </p>
            );
        }
      })}
    </div>
  );
}
