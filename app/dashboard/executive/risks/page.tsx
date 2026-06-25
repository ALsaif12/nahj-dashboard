import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { getPanelData } from '@/lib/data-service';
import { RiskExplorer } from '@/components/risk-explorer';

export const dynamic = 'force-dynamic';

export default async function ExecutiveRisksPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const { visibleRisks } = getPanelData('executive');

  return <div id="risks"><RiskExplorer risks={visibleRisks} /></div>;
}
