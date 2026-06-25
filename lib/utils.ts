import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns true if a value is null/undefined or an empty string. */
export function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

/** Coerce an Excel cell value to a finite number when possible, otherwise null.
 *  Handles Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩), Arabic thousands separator (٬),
 *  comma separators, and the suffixes "ألف" / "الف" (thousand) and "مليون" (million).
 *  Examples: "100 الف" → 100000, "1٬500" → 1500, "٢٥٠" → 250.
 */
export function toNumber(v: unknown): number | null {
  if (isBlank(v)) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const arabicDigits = v.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    let multiplier = 1;
    if (/(ألف|الف)/.test(arabicDigits)) multiplier = 1000;
    if (/مليون/.test(arabicDigits)) multiplier = 1_000_000;
    // Strip everything except digits, decimal point, and minus sign.
    const cleaned = arabicDigits.replace(/[٬,،]/g, '').replace(/[^\d.\-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n * multiplier : null;
  }
  return null;
}

/** Format a value for display: percentages with one decimal, counts with thousands separator. */
export function formatValue(v: number | null | undefined, unit: 'percentage' | 'count' | 'currency' | 'unknown'): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (unit === 'percentage') {
    const pct = v <= 1 ? v * 100 : v;
    return `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
  }
  if (unit === 'currency') return `${Math.round(v).toLocaleString('en-US')} SAR`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** Compute RAG status given an actual and a target. Green ≥ target, Amber within 10% below, Red >10% below. */
export function ragStatus(actual: number | null, target: number | null): 'green' | 'amber' | 'red' | 'none' {
  if (actual === null || target === null || !Number.isFinite(actual) || !Number.isFinite(target) || target === 0) return 'none';
  const ratio = actual / target;
  if (ratio >= 1) return 'green';
  if (ratio >= 0.9) return 'amber';
  return 'red';
}

/** Risk band on a 1..125 scale (P × I × Readiness). */
export function riskBand(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 24) return 'low';
  if (score <= 49) return 'medium';
  if (score <= 79) return 'high';
  return 'critical';
}

/** Map a band name to its hex color for charts and badges. */
export const RAG_COLORS = {
  green: '#10B981',
  amber: '#F59E0B',
  red: '#DC2626',
  none: '#94A3B8',
} as const;

export const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#DC2626',
} as const;

/** Format an ISO date as a short readable label. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Returns the effective actual for a KPI quarter — submitted value beats sheet value. */
export function effectiveActual(q: { actualSheet: number | null; actualSubmitted?: number | null }): number | null {
  if (q.actualSubmitted !== null && q.actualSubmitted !== undefined) return q.actualSubmitted;
  return q.actualSheet;
}

/** Quarter helpers for the current calendar year. */
export function currentQuarter(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = new Date().getMonth();
  if (m < 3) return 'Q1';
  if (m < 6) return 'Q2';
  if (m < 9) return 'Q3';
  return 'Q4';
}
