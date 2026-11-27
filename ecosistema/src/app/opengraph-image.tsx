import { ImageResponse } from "next/og";

export const alt = "Datos con Datos — Tecnología, datos y comunidad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph por defecto del ecosistema. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#F7F8FA", color: "#202833" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 600 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "#202833", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#91C5E8" }} />
          </div>
          Datos con Datos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -3, maxWidth: 980 }}>La tecnología cambia el mundo. Comprenderla nos permite transformarlo.</div>
        </div>
        <div style={{ display: "flex", gap: 36, fontSize: 24, color: "#55626F" }}>
          <span>DIVULGACIÓN</span>
          <span>CONSULTORÍA</span>
          <span>COMUNIDAD</span>
        </div>
      </div>
    ),
    size,
  );
}
