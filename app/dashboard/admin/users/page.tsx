import { listUsers } from '@/lib/users-store';
import { AdminUsersTable } from '@/components/admin-users-table';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  const users = listUsers();
  // Strip passwords before shipping to the client.
  const safe = users.map(({ password, ...u }) => u);
  return <AdminUsersTable initialUsers={safe} />;
}
