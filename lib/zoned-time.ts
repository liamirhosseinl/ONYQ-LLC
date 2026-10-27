/**
 * Minimal, dependency-free time-zone helpers built on Intl.
 * Used for campaign boundaries so that comparisons never depend on the visitor's
 * device time zone.
 */

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

function offsetMs(instantMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(new Date(instantMs)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

/**
 * Convert a wall-clock time ("YYYY-MM-DD HH:mm") in `timeZone` to the exact instant.
 * Throws on malformed input so a typo in the campaign config can never silently
 * produce an active promotion.
 */
export function zonedTimeToUtc(local: string, timeZone: string): Date {
  const match = LOCAL_PATTERN.exec(local.trim());
  if (!match) throw new Error(`Invalid local date-time "${local}". Expected "YYYY-MM-DD HH:mm".`);
  const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi, 0);
  // Two passes handle DST transitions for zones that observe them.
  let guess = naiveUtc - offsetMs(naiveUtc, timeZone);
  guess = naiveUtc - offsetMs(guess, timeZone);
  const result = new Date(guess);
  // Validate the round-trip (rejects impossible dates like 2026-02-31).
  const check = formatZoned(result, timeZone);
  if (check !== `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`) {
    throw new Error(`Local date-time "${local}" does not exist in ${timeZone}.`);
  }
  return result;
}

/** Format an instant as "YYYY-MM-DD HH:mm" in `timeZone`. */
export function formatZoned(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
