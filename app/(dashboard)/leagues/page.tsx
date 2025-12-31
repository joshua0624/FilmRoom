'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/common/Navigation';
import { CreateLeagueModal } from '@/components/leagues/CreateLeagueModal';
import { EditLeagueModal } from '@/components/leagues/EditLeagueModal';
import { JoinLeagueModal } from '@/components/leagues/JoinLeagueModal';
import { useLeague } from '@/contexts/LeagueContext';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/common/Button';
import { Plus, Users, Trophy, Settings, UserPlus } from 'lucide-react';

export default function LeaguesPage() {
  const { leagues, isLoading, refreshLeagues, setActiveLeague } = useLeague();
  const { data: session } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState<any>(null);
  const [joiningLeague, setJoiningLeague] = useState<any>(null);
  const [browsableLeagues, setBrowsableLeagues] = useState<any[]>([]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);

  const handleLeagueCreated = async (league: any) => {
    await refreshLeagues();
    setActiveLeague(league);
  };

  const handleLeagueUpdated = async () => {
    await refreshLeagues();
  };

  const handleLeagueJoined = async () => {
    await refreshLeagues();
    if (showBrowse) {
      fetchBrowsableLeagues();
    }
  };

  const fetchBrowsableLeagues = async () => {
    try {
      setIsLoadingBrowse(true);
      const response = await fetch('/api/leagues/browse');
      if (response.ok) {
        const data = await response.json();
        // Filter out leagues user is already in
        const userLeagueIds = leagues.map((l) => l.id);
        const available = data.filter((l: any) => !userLeagueIds.includes(l.id));
        setBrowsableLeagues(available);
      }
    } catch (error) {
      console.error('Error fetching browsable leagues:', error);
    } finally {
      setIsLoadingBrowse(false);
    }
  };

  useEffect(() => {
    if (showBrowse && session) {
      fetchBrowsableLeagues();
    }
  }, [showBrowse, session, leagues]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <main className="mx-auto max-w-[1280px] py-6 px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Leagues</h1>
          <div className="flex gap-2">
            <Button
              variant="tertiary"
              onClick={() => setShowBrowse(!showBrowse)}
              className="flex items-center gap-2"
            >
              {showBrowse ? (
                <>
                  <Trophy className="w-5 h-5" />
                  My Leagues
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Browse Leagues
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create League
            </Button>
          </div>
        </div>

        {showBrowse ? (
          /* Browse Leagues View */
          isLoadingBrowse ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-bg-secondary border border-border rounded-lg p-6 animate-pulse"
                >
                  <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-3" />
                  <div className="h-4 bg-bg-tertiary rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : browsableLeagues.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                No available leagues
              </h2>
              <p className="text-text-secondary mb-6">
                There are no public leagues available to join right now
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {browsableLeagues.map((league) => (
                <div
                  key={league.id}
                  className="bg-bg-secondary border border-border rounded-lg p-6 hover:border-accent-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {league.name}
                    </h3>
                    {!league.isPublic && (
                      <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                        Private
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{league._count?.teams || 0} teams</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span>{league._count?.sessions || 0} sessions</span>
                    </div>
                  </div>

                  <div className="mb-3 text-xs text-text-tertiary">
                    Created by {league.creator.username}
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => setJoiningLeague(league)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Join League
                  </Button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Leagues View */
          isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-bg-secondary border border-border rounded-lg p-6 animate-pulse"
                >
                  <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-3" />
                  <div className="h-4 bg-bg-tertiary rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : leagues.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              No leagues yet
            </h2>
            <p className="text-text-secondary mb-6">
              Create your first league to get started
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create League
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.map((league) => (
              <div
                key={league.id}
                className="bg-bg-secondary border border-border rounded-lg p-6 hover:border-accent-primary transition-colors cursor-pointer relative"
                onClick={() => setActiveLeague(league)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {league.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {!league.isPublic && (
                      <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                        Private
                      </span>
                    )}
                    {league.creatorId === session?.user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLeague(league);
                        }}
                        className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                        aria-label="Edit league"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{league._count?.teams || 0} teams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>{league._count?.sessions || 0} sessions</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-text-tertiary">
                  Created by {league.creator.username}
                </div>
              </div>
            ))}
          </div>
          )
        )}

        <CreateLeagueModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleLeagueCreated}
        />

        <EditLeagueModal
          isOpen={!!editingLeague}
          onClose={() => setEditingLeague(null)}
          league={editingLeague}
          userId={session?.user?.id || ''}
          onSuccess={handleLeagueUpdated}
        />

        <JoinLeagueModal
          isOpen={!!joiningLeague}
          onClose={() => setJoiningLeague(null)}
          league={joiningLeague}
          onSuccess={handleLeagueJoined}
        />
      </main>
    </div>
  );
}
