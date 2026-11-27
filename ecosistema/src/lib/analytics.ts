"use client";

type PlausibleFn = (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;

/**
 * Registro de conversiones. Solo actúa si Plausible está cargado
 * (NEXT_PUBLIC_PLAUSIBLE_DOMAIN). Plausible no usa cookies ni datos
 * personales, por lo que no requiere banner de consentimiento.
 */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  const w = window as unknown as { plausible?: PlausibleFn };
  try {
    w.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* la analítica nunca debe romper la interfaz */
  }
}
