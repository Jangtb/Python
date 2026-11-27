const LOCALE = "es-CL";

function wallParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

/** Convierte una fecha y hora "de pared" en una zona IANA a un instante UTC. */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const target = Date.UTC(y, m - 1, d, hh, mm);
  // Lanza RangeError si la zona no existe.
  new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const offset = wallParts(new Date(guess), timeZone) - guess;
    const next = target - offset;
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "America/Santiago", ...opts }).format(new Date(iso));
}

export function formatEventDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function eventDateParts(iso: string, timeZone: string): { month: string; day: string; weekday: string } {
  const d = new Date(iso);
  return {
    month: new Intl.DateTimeFormat(LOCALE, { timeZone, month: "short" }).format(d).replace(".", ""),
    day: new Intl.DateTimeFormat(LOCALE, { timeZone, day: "numeric" }).format(d),
    weekday: new Intl.DateTimeFormat(LOCALE, { timeZone, weekday: "long" }).format(d),
  };
}

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = (Date.parse(iso) - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "hace un momento";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 30 * 86_400) return rtf.format(Math.round(diff / 86_400), "day");
  return formatDate(iso);
}
