// Server-rendered helper that computes stats and hands off to the client overview.
// Used by all 3 team overview pages so they stay one-liners.

import { loadTeamPanel } from '@/lib/team-panel-data';
import { effectiveActual, ragStatus } from '@/lib/utils';
import { tasksByProgram } from '@/lib/tasks-store';
import { buildBoardUser } from '@/lib/task-board-data';
import { TeamOverview } from './team-overview';
import type { ProgramKey } from '@/lib/types';

export async function TeamOverviewPage({ programKey }: { programKey: ProgramKey }) {
  const { user, project, kpis, risks } = await loadTeamPanel(programKey);
  const tasks = tasksByProgram(programKey);
  const boardUser = buildBoardUser(user);

  const greens = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'green';
  }).length;
  const ambers = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'amber';
  }).length;
  const reds = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'red';
  }).length;
  const criticalRisks = risks.filter((r) => r.band === 'critical').length;
  const totalBudget = project.expectedBudget ?? project.totalCost;

  return (
    <TeamOverview
      programKey={programKey}
      project={project}
      kpis={kpis}
      risks={risks}
      tasks={tasks}
      viewer={{ username: boardUser.username, managePrograms: boardUser.managePrograms }}
      stats={{
        onTrack: greens,
        totalKpis: kpis.length,
        atRisk: ambers,
        offTrack: reds,
        totalRisks: risks.length,
        criticalRisks,
        totalBudget,
      }}
    />
  );
}
