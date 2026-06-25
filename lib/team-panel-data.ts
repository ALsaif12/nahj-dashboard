// Server helper used by the team panel layouts and sub-pages.
// Centralises auth, panel-data fetching, and counts so each route file stays small.

import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from './auth';
import { getPanelData } from './data-service';
import { canAccessPanel, canSubmitActuals as canSubmit, landingPath } from './permissions';
import type { ProgramKey } from './types';

export async function loadTeamPanel(programKey: ProgramKey) {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, programKey)) redirect(landingPath(user));

  const wb = getPanelData('executive').workbook; // full workbook; we filter below
  const project = wb.projects[programKey];
  const kpis = wb.kpis.filter((k) => k.programs.includes(programKey));
  const risks = wb.risks.filter((r) => r.programKey === programKey);
  const canSubmitActuals = canSubmit(user, [programKey]);

  return { user, workbook: wb, project, kpis, risks, canSubmit: canSubmitActuals };
}
