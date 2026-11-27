import { Fragment, type ReactNode } from "react";

/**
 * Formato en línea mínimo y seguro: **negrita**, *cursiva* y [texto](https://…).
 * No interpreta HTML: el contenido se renderiza como texto.
 */
export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(<Fragment key={key++}>{text.slice(last, match.index)}</Fragment>);
    if (match[1]) nodes.push(<strong key={key++}>{match[1]}</strong>);
    else if (match[2]) nodes.push(<em key={key++}>{match[2]}</em>);
    else if (match[3] && match[4]) {
      const external = match[4].startsWith("http");
      nodes.push(
        <a key={key++} href={match[4]} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {match[3]}
        </a>,
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return <>{nodes}</>;
}
