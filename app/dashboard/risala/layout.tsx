import { TeamPanelChrome } from '@/components/team-panel-chrome';
import { loadTeamPanel } from '@/lib/team-panel-data';

export const dynamic = 'force-dynamic';

export default async function RisalaLayout({ children }: { children: React.ReactNode }) {
  const { project, kpis, risks, canSubmit } = await loadTeamPanel('risala');
  return (
    <TeamPanelChrome
      programKey="risala"
      project={project}
      counts={{ kpis: kpis.length, risks: risks.length, milestones: project.milestones.length }}
      canSubmit={canSubmit}
    >
      {children}
    </TeamPanelChrome>
  );
}
