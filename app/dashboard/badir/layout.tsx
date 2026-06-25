import { TeamPanelChrome } from '@/components/team-panel-chrome';
import { loadTeamPanel } from '@/lib/team-panel-data';

export const dynamic = 'force-dynamic';

export default async function BadirLayout({ children }: { children: React.ReactNode }) {
  const { project, kpis, risks, canSubmit } = await loadTeamPanel('badir');
  return (
    <TeamPanelChrome
      programKey="badir"
      project={project}
      counts={{ kpis: kpis.length, risks: risks.length, milestones: project.milestones.length }}
      canSubmit={canSubmit}
    >
      {children}
    </TeamPanelChrome>
  );
}
