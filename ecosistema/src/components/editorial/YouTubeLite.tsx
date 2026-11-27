"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/ui/icons";

/**
 * Video de YouTube que solo carga el reproductor (y sus cookies) cuando la
 * persona decide verlo. Usa el dominio youtube-nocookie.com.
 */
export function YouTubeLite({ videoId, title }: { videoId: string; title: string }) {
  const [active, setActive] = useState(false);
  const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div className="youtube-lite">
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="youtube-lite__btn" onClick={() => setActive(true)}>
          <span className="youtube-lite__play">
            <PlayIcon size={26} />
          </span>
          <span>Reproducir video: {title}</span>
          <span className="xsmall" style={{ opacity: 0.8 }}>
            Se cargará el reproductor de YouTube
          </span>
        </button>
      )}
    </div>
  );
}
