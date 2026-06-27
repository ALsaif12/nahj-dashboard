import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { tasksByAssignee } from '@/lib/tasks-store';
import { buildBoardUser, eligibleMembers, buildLinkOptions } from '@/lib/task-board-data';
import { TaskBoard } from '@/components/task-board';
import { TranslatedHeader } from '@/components/translated-header';
import type { ProgramKey } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MyTasksPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  const tasks = tasksByAssignee(user.username);
  const boardUser = buildBoardUser(user);
  const scope = user.permissions.accessibleProgramPanels as ProgramKey[];
  const members = eligibleMembers(scope);
  const linkOptions = buildLinkOptions(scope);

  return (
    <div>
      <TranslatedHeader titleKey="tasks.mine.title" descriptionKey="tasks.mine.subtitle" />
      <TaskBoard
        initialTasks={tasks}
        user={boardUser}
        members={members}
        linkOptions={linkOptions}
        programOptions={boardUser.managePrograms}
        showProgram
      />
    </div>
  );
}
