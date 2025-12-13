import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/common/Navigation';
import { TeamDetail } from '@/components/teams/TeamDetail';

export default async function TeamDetailPage({
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
      <Navigation showBackButton backHref="/teams" />
      <main className="mx-auto max-w-[1280px] py-6 px-6">
        <TeamDetail teamId={id} userId={session.user.id!} />
      </main>
    </div>
  );
}

