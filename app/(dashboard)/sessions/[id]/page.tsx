import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/common/Navigation';
import { SessionViewer } from '@/components/sessions/SessionViewer';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation showBackButton backHref="/sessions" />
      <main className="mx-auto max-w-[1280px] py-4 sm:py-6 px-2 sm:px-6">
        <SessionViewer sessionId={id} userId={session.user.id!} />
      </main>
    </div>
  );
}


