import { listEntries } from '@/lib/audit-log';
import { AdminAuditLog } from '@/components/admin-audit-log';

export const dynamic = 'force-dynamic';

export default function AdminAuditPage() {
  const entries = listEntries({ limit: 200 });
  return <AdminAuditLog entries={entries} />;
}
