// lib/admin-reports.ts
// Shared types + data layer for /admin/reports/*
// Everything here is written so swapping the mock generators for real
// `fetch("/api/reports/...")` calls later is a one-line change per function
// (see the `simulateFetch` wrapper below).

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  requesterPhone: string;
  status: RequestStatus;
  priority: RequestPriority;
  bloodType: BloodType;
  units: number;
  hospitalName: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationItem {
  id: string;
  donorName: string;
  bloodType: BloodType;
  units: number;
  driveId: string;
  createdAt: string;
}

export interface BloodDrive {
  id: string;
  name: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Deterministic "randomness" — same seed always produces the same number.
// This replaces bare Math.random() calls in render, which used to make bars
// and counts jump around on every re-render/tab switch.
// ---------------------------------------------------------------------------
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % 1000) / 1000;
}

const HOSPITALS = [
  'Manila General Hospital',
  'Quezon City Medical Center',
  "St. Luke's Medical Center",
  'Philippine General Hospital',
  'Makati Medical Center',
];

const REQUESTERS = [
  { name: 'Dr. Juan Dela Cruz', email: 'juan.delacruz@hospital.com', phone: '09123456789' },
  { name: 'Dr. Maria Santos', email: 'maria.santos@hospital.com', phone: '09171234567' },
  { name: 'Dr. Jose Ramirez', email: 'jose.ramirez@hospital.com', phone: '09281234567' },
  { name: 'Dr. Ana Reyes', email: 'ana.reyes@hospital.com', phone: '09051234567' },
];

const STATUSES: RequestStatus[] = ['pending', 'approved', 'rejected', 'completed'];
const PRIORITIES: RequestPriority[] = ['low', 'medium', 'high', 'critical'];

export const BLOOD_DRIVES: BloodDrive[] = [
  { id: 'd1', name: 'Summer Blood Drive 2026', date: '2026-06-15' },
  { id: 'd2', name: 'Hospital Blood Drive', date: '2026-07-20' },
  { id: 'd3', name: 'University Outreach Drive', date: '2026-08-02' },
];

// Single source of truth for all request-related mock data. Every tab on the
// Requests page derives its numbers from this same array, so the summary
// cards, status breakdown, by-hospital, and by-blood-type views can never
// disagree with each other (they used to show independently-randomized,
// inconsistent numbers).
export function generateRequests(count = 42): RequestItem[] {
  const items: RequestItem[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `req-${i}`;
    const requester = REQUESTERS[i % REQUESTERS.length];
    const daysAgo = Math.floor(seededRandom(seed + 'd') * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    items.push({
      id: seed,
      title: 'Blood Donation Request',
      description: 'Blood donation needed for patient care.',
      requester: requester.name,
      requesterEmail: requester.email,
      requesterPhone: requester.phone,
      status: STATUSES[Math.floor(seededRandom(seed + 's') * STATUSES.length)],
      priority: PRIORITIES[Math.floor(seededRandom(seed + 'p') * PRIORITIES.length)],
      bloodType: BLOOD_TYPES[Math.floor(seededRandom(seed + 'b') * BLOOD_TYPES.length)],
      units: Math.floor(seededRandom(seed + 'u') * 4) + 1,
      hospitalName: HOSPITALS[Math.floor(seededRandom(seed + 'h') * HOSPITALS.length)],
      location: 'Metro Manila',
      createdAt,
      updatedAt: createdAt,
    });
  }
  return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function generateDonations(count = 60): DonationItem[] {
  const items: DonationItem[] = [];
  for (let i = 0; i < count; i++) {
    const seed = `don-${i}`;
    const daysAgo = Math.floor(seededRandom(seed + 'd') * 60);
    items.push({
      id: seed,
      donorName: `Donor #${1000 + i}`,
      bloodType: BLOOD_TYPES[Math.floor(seededRandom(seed + 'b') * BLOOD_TYPES.length)],
      units: Math.floor(seededRandom(seed + 'u') * 2) + 1,
      driveId: BLOOD_DRIVES[Math.floor(seededRandom(seed + 'r') * BLOOD_DRIVES.length)].id,
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    });
  }
  return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

// Derived aggregation helpers -------------------------------------------------

export function countByBloodType<T extends { bloodType: BloodType; units?: number }>(
  items: T[],
): { type: BloodType; count: number; units: number }[] {
  return BLOOD_TYPES.map((type) => {
    const matches = items.filter((i) => i.bloodType === type);
    return {
      type,
      count: matches.length,
      units: matches.reduce((sum, i) => sum + (i.units ?? 0), 0),
    };
  });
}

export function countByStatus(items: RequestItem[]) {
  return STATUSES.map((status) => ({
    status,
    count: items.filter((i) => i.status === status).length,
  }));
}

export function countByHospital(items: RequestItem[]) {
  const map = new Map<string, { pending: number; approved: number; rejected: number; completed: number; total: number }>();
  for (const item of items) {
    const entry = map.get(item.hospitalName) ?? { pending: 0, approved: 0, rejected: 0, completed: 0, total: 0 };
    entry[item.status]++;
    entry.total++;
    map.set(item.hospitalName, entry);
  }
  return Array.from(map.entries())
    .map(([hospitalName, stats]) => ({ hospitalName, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export function monthlyTrend(items: { createdAt: string; units?: number }[], months = 6) {
  const buckets: { label: string; count: number; units: number }[] = [];
  const now = new Date();
  for (let m = months - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const matches = items.filter((i) => {
      const id = new Date(i.createdAt);
      return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
    });
    buckets.push({ label, count: matches.length, units: matches.reduce((s, i) => s + (i.units ?? 0), 0) });
  }
  return buckets;
}

// Simulated network layer -----------------------------------------------------
// Swap the body of these with real `await fetch('/api/...')` calls when the
// backend endpoints exist; callers already await them and handle loading state.
export async function simulateFetch<T>(factory: () => T, delayMs = 500): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return factory();
}

// CSV export -------------------------------------------------------------------
export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const str = String(val ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}