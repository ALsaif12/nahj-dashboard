import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { listTasks } from '@/lib/tasks-store';
import { buildBoardUser, eligibleMembers, buildLinkOptions } from '@/lib/task-board-data';
import { TaskBoard } from '@/components/task-board';
import type { ProgramKey } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PROGRAMS: ProgramKey[] = ['badir', 'risala', 'iktashif'];

export default async function ExecutiveTasksPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const tasks = listTasks({ programKeys: PROGRAMS });
  const boardUser = buildBoardUser(user);
  const members = eligibleMembers(PROGRAMS);
  const linkOptions = buildLinkOptions(PROGRAMS);

  return (
    <div id="tasks">
      <TaskBoard
        initialTasks={tasks}
        user={boardUser}
        members={members}
        linkOptions={linkOptions}
        programOptions={boardUser.managePrograms}
        showProgram
        showFilters
      />
    </div>
  );
}
