import { loadTeamPanel } from '@/lib/team-panel-data';
import { tasksByProgram } from '@/lib/tasks-store';
import { buildBoardUser, eligibleMembers, buildLinkOptions } from '@/lib/task-board-data';
import { canManageTasks } from '@/lib/permissions';
import { TaskBoard } from '@/components/task-board';
import type { ProgramKey } from '@/lib/types';

/** Server component that renders a single program's task board. */
export async function ProgramTasksPage({ programKey }: { programKey: ProgramKey }) {
  const { user } = await loadTeamPanel(programKey);
  const tasks = tasksByProgram(programKey);
  const boardUser = buildBoardUser(user);
  const members = eligibleMembers([programKey]);
  const linkOptions = buildLinkOptions([programKey]);
  const programOptions = canManageTasks(user, programKey) ? [programKey] : [];

  return (
    <div id="tasks">
      <TaskBoard
        initialTasks={tasks}
        user={boardUser}
        members={members}
        linkOptions={linkOptions}
        programOptions={programOptions}
      />
    </div>
  );
}
