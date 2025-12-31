'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users } from 'lucide-react';
import { Navigation } from '@/components/common/Navigation';
import { CreateTeamModal } from '@/components/teams/CreateTeamModal';
import { TeamCard } from '@/components/teams/TeamCard';
import { Button } from '@/components/common/Button';

interface Team {
  id: string;
  name: string;
  color: string;
  _count: {
    members: number;
    players: number;
  };
}

export default function TeamsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      // Redirect guests to guest page
      const isGuest = (session?.user as any)?.isGuest || false;
      if (isGuest) {
        router.push('/guest');
        return;
      }
      fetchTeams();
    }
  }, [status, session, router]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading teams...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Your Teams</h1>
            <p className="text-text-secondary mt-1">
              Manage your teams and rosters
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Team
          </Button>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No teams yet
            </h3>
            <p className="text-text-secondary mb-6">
              Create your first team to get started
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Team
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                id={team.id}
                name={team.name}
                color={team.color}
                creator={{ id: '', username: '' }}
                memberCount={team._count.members}
                playerCount={team._count.players}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTeams();
          }}
        />
      )}
    </div>
  );
}
