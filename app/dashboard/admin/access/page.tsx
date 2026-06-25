import { listUsers } from '@/lib/users-store';
import { AdminAccessMatrix } from '@/components/admin-access-matrix';

export const dynamic = 'force-dynamic';

export default function AdminAccessPage() {
  const safe = listUsers().map(({ password, ...u }) => u);
  return <AdminAccessMatrix users={safe} />;
}
