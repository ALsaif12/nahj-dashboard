import { redirect } from 'next/navigation';
import { loadTeamPanel } from '@/lib/team-panel-data';
import { InputForm } from '@/components/input-form';
import { TeamSubmitEmpty } from '@/components/team-submit-empty';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { kpis, canSubmit } = await loadTeamPanel('risala');
  if (!canSubmit) redirect('/dashboard/risala/overview');
  if (kpis.length === 0) return <TeamSubmitEmpty programKey="risala" />;
  return <div id="input-form"><InputForm kpis={kpis} /></div>;
}
