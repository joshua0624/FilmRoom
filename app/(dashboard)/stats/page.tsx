'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/common/Navigation';
import { StatsFilters } from '@/components/stats/StatsFilters';
import { PlayerLeaderboard } from '@/components/stats/PlayerLeaderboard';
import { useLeague } from '@/contexts/LeagueContext';
import { SignOutButton } from '@/components/auth/SignOutButton';

interface PlayerStats {
  playerName: string;
  goals: number;
  assists: number;
  gamesPlayed: number;
  pointsPerGame?: number;
  assistsPerGame?: number;
  singleGameValue?: number;
  sessionId?: string;
  week?: number | null;
  opponent?: string | null;
}

interface League {
  id: string;
  name: string;
  creatorId: string;
  isPublic: boolean;
  createdAt: string;
  creator: {
    id: string;
    username: string;
  };
  _count?: {
    teams: number;
    sessions: number;
  };
}

export default function StatsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { activeLeague } = useLeague();
  const [guestLeague, setGuestLeague] = useState<League | null>(null);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    weeks: [] as string[],
    teamId: '',
    opponentTeamId: '',
    sortBy: 'goals' as 'goals' | 'assists' | 'combined' | 'goalsPerGame' | 'assistsPerGame' | 'combinedPerGame',
    viewMode: 'cumulative' as 'cumulative' | 'singleGame',
    singleGameCategory: 'points' as 'points' | 'assists' | 'combined',
  });

  const isGuest = (session?.user as any)?.isGuest || false;
  const currentLeague = isGuest ? guestLeague : activeLeague;

  // Load guest league from localStorage if in guest mode
  useEffect(() => {
    if (isGuest) {
      const stored = localStorage.getItem('guest_league');
      if (stored) {
        try {
          setGuestLeague(JSON.parse(stored));
        } catch (err) {
          console.error('Failed to parse guest league:', err);
          router.push('/guest');
        }
      } else {
        router.push('/guest');
      }
    }
  }, [isGuest, router]);

  const fetchStats = async () => {
    if (!currentLeague) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('leagueId', currentLeague.id);
      if (filters.teamId) {
        params.append('teamId', filters.teamId);
      }
      if (filters.weeks.length > 0) {
        params.append('weeks', filters.weeks.join(','));
      }
      if (filters.opponentTeamId) {
        params.append('opponentTeamId', filters.opponentTeamId);
      }
      params.append('sortBy', filters.sortBy);
      params.append('viewMode', filters.viewMode);
      if (filters.viewMode === 'singleGame') {
        params.append('singleGameCategory', filters.singleGameCategory);
      }

      const response = await fetch(`/api/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentLeague]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {isGuest ? (
        <nav className="bg-bg-secondary border-b border-border sticky top-0 z-50">
          <div className="max-w-[1280px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push('/guest')}
                  className="text-2xl font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
                >
                  FilmRoom
                </button>
                {currentLeague && (
                  <div className="text-sm text-text-secondary">
                    {currentLeague.name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-text-secondary">
                  Guest Mode
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </nav>
      ) : (
        <Navigation />
      )}
      <main className="mx-auto max-w-[1280px] py-6 px-6">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Player Statistics</h1>

        <StatsFilters
          filters={filters}
          onFiltersChange={setFilters}
          league={currentLeague}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-500">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6">
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-bg-secondary border border-border rounded-lg">
                  <div className="w-8 h-8 bg-bg-tertiary rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-bg-tertiary rounded w-1/4 animate-pulse" />
                    <div className="h-3 bg-bg-tertiary rounded w-1/6 animate-pulse" />
                  </div>
                  <div className="h-4 bg-bg-tertiary rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PlayerLeaderboard 
            stats={stats} 
            viewMode={filters.viewMode}
            singleGameCategory={filters.singleGameCategory}
          />
        )}
      </main>
    </div>
  );
}

