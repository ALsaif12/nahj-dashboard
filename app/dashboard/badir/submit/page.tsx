import { redirect } from 'next/navigation';
import { loadTeamPanel } from '@/lib/team-panel-data';
import { InputForm } from '@/components/input-form';
import { TeamSubmitEmpty } from '@/components/team-submit-empty';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { kpis, canSubmit } = await loadTeamPanel('badir');
  if (!canSubmit) redirect('/dashboard/badir/overview');
  if (kpis.length === 0) return <TeamSubmitEmpty programKey="badir" />;
  return <div id="input-form"><InputForm kpis={kpis} /></div>;
}
