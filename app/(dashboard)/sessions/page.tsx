import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/common/Navigation';
import { SessionsList } from '@/components/sessions/SessionsList';

export default async function SessionsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <main className="mx-auto max-w-[1280px] py-6 px-6">
        <SessionsList />
      </main>
    </div>
  );
}

