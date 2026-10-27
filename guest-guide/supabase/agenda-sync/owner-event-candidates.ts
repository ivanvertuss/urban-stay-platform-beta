/**
 * Guest Guide agenda sync — pure preparation module (NOT deployed).
 * Converts owner-authored property_content.manualEvents into review candidates.
 * This file does not write to Supabase and cannot approve content.
 * City events/Ticketmaster must be fetched and persisted by a trusted backend,
 * never copied from a visitor's localStorage.
 */
export type ManualEvent = {
  id?: string; name?: string; title?: string; date?: string;
  description?: string; venue?: string; url?: string;
};
export type EventCandidate = {
  source: "owner"; external_id: string; title: string;
  description: string; venue: string; city: string;
  starts_at: string; source_url: string | null;
};
const normalize = (v: unknown) => String(v ?? "").trim();
function validDate(value: unknown): string | null {
  const raw = normalize(value);
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)) return null;
  const d = new Date(raw + "T12:00:00Z");
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== raw
    ? null : d.toISOString();
}
function httpsUrl(value: unknown): string | null {
  try { const u = new URL(normalize(value)); return u.protocol === "https:" ? u.href : null; }
  catch { return null; }
}
export function ownerEventCandidates(
  raw: unknown, propertyId: string, city: string, now = new Date()
): EventCandidate[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<string>();
  const result: EventCandidate[] = [];
  for (const value of raw) {
    if (!value || typeof value !== "object") continue;
    const event = value as ManualEvent;
    const title = normalize(event.name || event.title);
    const date = validDate(event.date);
    if (!title || !date || Date.parse(date) < Date.parse(now.toISOString().slice(0,10) + "T00:00:00Z")) continue;
    const identity = normalize(event.id) || [title.toLowerCase(), date.slice(0,10), normalize(event.venue).toLowerCase()].join("|");
    const external_id = propertyId + ":" + identity;
    if (unique.has(external_id)) continue;
    unique.add(external_id);
    result.push({
      source: "owner", external_id, title,
      description: normalize(event.description), venue: normalize(event.venue),
      city: normalize(city), starts_at: date, source_url: httpsUrl(event.url)
    });
  }
  return result.sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
}
