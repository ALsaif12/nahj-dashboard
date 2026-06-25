import { loadTeamPanel } from '@/lib/team-panel-data';
import { RiskExplorer } from '@/components/risk-explorer';
import { TeamRisksEmpty } from '@/components/team-risks-empty';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { risks } = await loadTeamPanel('badir');
  if (risks.length === 0) return <TeamRisksEmpty programKey="badir" />;
  return <div id="risks"><RiskExplorer risks={risks} /></div>;
}
