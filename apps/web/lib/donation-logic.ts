/** Small helpers for the donations page: distance, opening hours and who can give blood to whom. */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Straight-line distance between two points in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/**
 * Is the place open right now? Understands "24/7 Helpline" and "09:00–17:00".
 * Returns null when the text is not a time range, so the page shows nothing rather than guessing.
 */
export function isOpenNow(hours: string | undefined, now: Date = new Date()): boolean | null {
  if (!hours) return null;
  if (/24\s*\/\s*7/.test(hours)) return true;
  const match = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(hours);
  if (!match) return null;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= start && current < end;
}

// ─── Blood group compatibility (red cell donation) ───────────────────────────
// For each recipient group, the donor groups whose blood they can safely receive.
const CAN_RECEIVE_FROM: Record<string, string[]> = {
  'O−': ['O−'],
  'O+': ['O+', 'O−'],
  'A−': ['A−', 'O−'],
  'A+': ['A+', 'A−', 'O+', 'O−'],
  'B−': ['B−', 'O−'],
  'B+': ['B+', 'B−', 'O+', 'O−'],
  'AB−': ['AB−', 'A−', 'B−', 'O−'],
  'AB+': ['AB+', 'AB−', 'A+', 'A−', 'B+', 'B−', 'O+', 'O−'],
};

/** Donor groups that can give to someone who needs `recipientGroup`. */
export function donorGroupsFor(recipientGroup: string): string[] {
  return CAN_RECEIVE_FROM[recipientGroup] ?? [recipientGroup];
}

/** Recipient groups that can receive from a donor with `donorGroup`. */
export function recipientGroupsFor(donorGroup: string): string[] {
  return Object.keys(CAN_RECEIVE_FROM).filter((r) => CAN_RECEIVE_FROM[r].includes(donorGroup));
}

/**
 * Which community posts to show for the group the person picked.
 *  - "I want to give" → people asking for blood that this group can give.
 *  - "I need a donation" → donors whose blood this group can receive.
 * Organ posts have no blood group, so they match on the organ name instead.
 */
export function postMatchesSearch(
  post: { type: string; mode: string; group: string },
  search: { type: 'blood' | 'organ'; mode: 'give' | 'receive'; group: string }
): boolean {
  if (post.type !== search.type) return false;
  if (post.mode === search.mode) return false;
  if (search.type === 'organ') return true;
  return search.mode === 'give'
    ? recipientGroupsFor(search.group).includes(post.group)
    : donorGroupsFor(search.group).includes(post.group);
}
