import { isProvisional, profile } from "@/content/consulting";
import { initials } from "@/lib/text";

/** Fotografía profesional; mientras no exista, un marco con iniciales claramente marcado. */
export function Portrait() {
  if (profile.photoUrl && !isProvisional("photo")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.photoUrl} alt={`Fotografía de ${profile.name}`} className="portrait" style={{ objectFit: "cover", width: "100%" }} />;
  }
  return (
    <div className="portrait" role="img" aria-label="Espacio reservado para la fotografía profesional">
      <div className="portrait__placeholder">
        <span className="portrait__initials">{initials(profile.name)}</span>
        <span className="badge badge--pending">Fotografía pendiente</span>
      </div>
    </div>
  );
}
