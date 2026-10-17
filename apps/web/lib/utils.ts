import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePassportId(email: string): string {
  if (!email) return '';
  if (email.toLowerCase() === 'patient@smartcare.demo') return 'SC-PASSPORT-8924';
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  return `SC-PASSPORT-${Math.abs(hash).toString().slice(0, 4).padStart(4, '0')}`;
}

export function getTriageColor(triage: string): string {
  const t = triage?.toLowerCase();
  if (t === 'red') return 'triage-red';
  if (t === 'yellow') return 'triage-yellow';
  if (t === 'green') return 'triage-green';
  return 'triage-unassessed';
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}

function formatClock(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return hhmm;
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? 'pm' : 'am';
  return `${hour % 12 || 12}:${match[2]} ${suffix}`;
}

/** When the patient booked, for the doctor's list. Example: "17 Oct, 10:42 am" */
export function formatBookedAt(iso?: string): string {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${day}, ${formatClock(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)}`;
}

/** The time the patient is expected. Example: "Today, 4:30 pm" or "Tomorrow, 9:30 am" */
export function formatAppointmentTime(date?: string, slot?: string): string {
  const time = slot && /^\d{1,2}:\d{2}$/.test(slot) ? formatClock(slot) : slot || 'Next available';
  if (!date) return time;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return time;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const dayLabel =
    days === 0
      ? 'Today'
      : days === 1
      ? 'Tomorrow'
      : days === -1
      ? 'Yesterday'
      : target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${dayLabel}, ${time}`;
}

