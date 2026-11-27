import { contactChannels } from "@/config/site";
import { WhatsAppIcon } from "./icons";

/** Botón contextual de WhatsApp. No se muestra si NEXT_PUBLIC_WHATSAPP_NUMBER no está configurado. */
export function WhatsAppLink({ message, label = "Escribir por WhatsApp", className = "btn btn--secondary" }: { message: string; label?: string; className?: string }) {
  if (!contactChannels.whatsappNumber) return null;
  const href = `https://wa.me/${contactChannels.whatsappNumber}?text=${encodeURIComponent(message)}`;
  return (
    <a href={href} className={`${className} wa-link`} target="_blank" rel="noopener noreferrer" data-analytics="whatsapp">
      <WhatsAppIcon />
      {label}
      <span className="visually-hidden">(se abre en una nueva pestaña)</span>
    </a>
  );
}
