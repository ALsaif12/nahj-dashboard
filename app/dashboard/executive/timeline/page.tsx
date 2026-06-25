import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { getPanelData } from '@/lib/data-service';
import { ProgramGanttStrip } from '@/components/program-gantt-strip';

export const dynamic = 'force-dynamic';

export default async function ExecutiveTimelinePage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const { workbook } = getPanelData('executive');
  const projects = [workbook.projects.badir, workbook.projects.risala, workbook.projects.iktashif];

  return <ProgramGanttStrip projects={projects} />;
}
