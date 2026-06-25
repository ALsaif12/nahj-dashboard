// Derives a "Pending / Partial / Submitted" status per program for the current
// quarter, based on which KPIs have an actual reading (sheet OR submitted).
//
// This intentionally does NOT track approval — that's a future Priority 2
// workflow item (CEO review step). Right now we just answer: "did the program
// file their numbers this quarter?"

import type { Kpi, ProgramKey, Quarter } from './types';
import { currentQuarter, effectiveActual } from './utils';

export type ReportingStatus = 'pending' | 'partial' | 'submitted';

export interface ReportingState {
  program: ProgramKey;
  quarter: Quarter;
  expected: number;
  filed: number;
  status: ReportingStatus;
}

/** Returns reporting state for one program in the current calendar quarter. */
export function reportingFor(kpis: Kpi[], program: ProgramKey, quarter: Quarter = currentQuarter()): ReportingState {
  // KPIs in scope: linked to this program AND due in this quarter given frequency.
  const scope = kpis.filter((k) => k.programs.includes(program) && isDueThisQuarter(k.frequency, quarter));
  const filed = scope.filter((k) => {
    const q = k.quarters.find((qq) => qq.quarter === quarter);
    return q ? effectiveActual(q) !== null : false;
  }).length;
  const expected = scope.length;
  const status: ReportingStatus = expected === 0
    ? 'submitted'              // nothing was due — treat as filed
    : filed === 0
      ? 'pending'
      : filed >= expected
        ? 'submitted'
        : 'partial';
  return { program, quarter, expected, filed, status };
}

function isDueThisQuarter(freq: Kpi['frequency'], q: Quarter): boolean {
  if (freq === 'quarterly') return true;
  if (freq === 'semiannual') return q === 'Q2' || q === 'Q4';
  if (freq === 'annual') return q === 'Q4';
  return true;
}
