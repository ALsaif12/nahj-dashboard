import { loadTeamPanel } from '@/lib/team-panel-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GanttChart } from '@/components/gantt-chart';
import { TeamTimelineHeader } from '@/components/team-timeline-header';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { project } = await loadTeamPanel('risala');
  return (
    <Card>
      <CardHeader><TeamTimelineHeader project={project} /></CardHeader>
      <CardContent><GanttChart milestones={project.milestones} startDate={project.startDate} endDate={project.endDate} /></CardContent>
    </Card>
  );
}
