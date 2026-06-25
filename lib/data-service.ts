// Composes the read-only Excel data with the writable actuals overlay
// and applies panel-based access filters.

import 'server-only';
import { loadWorkbook } from './excel-loader';
import { latestActualsByKpi } from './db';
import { getWorkbookBus } from './file-watcher';
import type { Workbook, ProgramKey, Kpi, Risk } from './types';
import type { PanelKey } from './permissions';

// Boot the file watcher on first import. The bus self-guards against duplicate starts.
getWorkbookBus();

export interface PanelData {
  workbook: Workbook;
  visibleKpis: Kpi[];
  visibleRisks: Risk[];
  visiblePrograms: ProgramKey[];
}

export function getData(): Workbook {
  const wb = loadWorkbook();
  const overlay = latestActualsByKpi();
  const kpis = wb.kpis.map((k) => ({
    ...k,
    quarters: k.quarters.map((q) => {
      const sub = overlay[`${k.id}:${q.quarter}`];
      return { ...q, actualSubmitted: sub ? sub.value : null };
    }),
  }));
  return { ...wb, kpis };
}

/**
 * Returns the slice of data appropriate for a given panel key.
 *
 * - 'executive' or 'admin' → full dataset
 * - program key → just that program's KPIs/risks (KPIs the source linked
 *   to the program; risks tagged with the program).
 */
export function getPanelData(panel: PanelKey): PanelData {
  const wb = getData();
  if (panel === 'executive' || panel === 'admin') {
    return {
      workbook: wb,
      visibleKpis: wb.kpis,
      visibleRisks: wb.risks,
      visiblePrograms: ['badir', 'risala', 'iktashif'],
    };
  }
  const program = panel;
  return {
    workbook: wb,
    visibleKpis: wb.kpis.filter((k) => k.programs.includes(program)),
    visibleRisks: wb.risks.filter((r) => r.programKey === program),
    visiblePrograms: [program],
  };
}

// effectiveActual moved to lib/utils so client components can import it without the server-only barrier.
export { effectiveActual } from './utils';
