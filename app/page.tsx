import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { landingPath } from '@/lib/permissions';

export default async function Index() {
  const user = await getSession();
  if (!user) redirect('/login');
  redirect(landingPath(user));
}
