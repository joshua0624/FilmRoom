'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/common/Navigation';
import { StatsFilters } from '@/components/stats/StatsFilters';
import { PlayerLeaderboard } from '@/components/stats/PlayerLeaderboard';
import { useLeague } from '@/contexts/LeagueContext';

interface PlayerStats {
  playerName: string;
  goals: number;
  assists: number;
  gamesPlayed: number;
  pointsPerGame?: number;
  assistsPerGame?: number;
  singleGameValue?: number;
  sessionId?: string;
}

export default function StatsPage() {
  const { activeLeague } = useLeague();
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

  const fetchStats = async () => {
    if (!activeLeague) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('leagueId', activeLeague.id);
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
  }, [filters, activeLeague]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <main className="mx-auto max-w-[1280px] py-6 px-6">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Player Statistics</h1>

        <StatsFilters
          filters={filters}
          onFiltersChange={setFilters}
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

