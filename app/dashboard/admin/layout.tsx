import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel } from '@/lib/permissions';
import { AdminPanelChrome } from '@/components/admin-panel-chrome';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'admin')) redirect('/dashboard/executive');

  return <AdminPanelChrome>{children}</AdminPanelChrome>;
}
