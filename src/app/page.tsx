import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function IndexPage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
}
