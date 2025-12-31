'use client';

import { useEffect, useState } from 'react';
import { useLeague } from '@/contexts/LeagueContext';

interface Team {
  id: string;
  name: string;
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

interface StatsFiltersProps {
  filters: {
    weeks: string[];
    teamId: string;
    opponentTeamId: string;
    sortBy: 'goals' | 'assists' | 'combined' | 'goalsPerGame' | 'assistsPerGame' | 'combinedPerGame';
    viewMode: 'cumulative' | 'singleGame';
    singleGameCategory: 'points' | 'assists' | 'combined';
  };
  onFiltersChange: (filters: {
    weeks: string[];
    teamId: string;
    opponentTeamId: string;
    sortBy: 'goals' | 'assists' | 'combined' | 'goalsPerGame' | 'assistsPerGame' | 'combinedPerGame';
    viewMode: 'cumulative' | 'singleGame';
    singleGameCategory: 'points' | 'assists' | 'combined';
  }) => void;
  league?: League | null;
}

export const StatsFilters = ({ filters, onFiltersChange, league }: StatsFiltersProps) => {
  const { activeLeague } = useLeague();
  // Use the passed league prop if available, otherwise fall back to activeLeague from context
  const currentLeague = league !== undefined ? league : activeLeague;

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!currentLeague) {
        setIsLoadingTeams(false);
        return;
      }

      try {
        const response = await fetch(`/api/teams?leagueId=${currentLeague.id}`);
        if (response.ok) {
          const data = await response.json();
          setTeams(data);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [currentLeague]);

  useEffect(() => {
    const fetchAvailableWeeks = async () => {
      if (!currentLeague) {
        setIsLoadingWeeks(false);
        return;
      }

      try {
        const response = await fetch(`/api/sessions?leagueId=${currentLeague.id}`);
        if (response.ok) {
          const sessions = await response.json();
          const weeks = sessions
            .map((s: any) => s.week)
            .filter((w: any) => w !== null && w !== undefined)
            .sort((a: number, b: number) => a - b);
          const uniqueWeeks = Array.from(new Set<number>(weeks));
          setAvailableWeeks(uniqueWeeks);
        }
      } catch (err) {
        console.error('Error fetching weeks:', err);
      } finally {
        setIsLoadingWeeks(false);
      }
    };

    fetchAvailableWeeks();
  }, [currentLeague]);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleWeeksChange = (weekValue: string) => {
    const currentWeeks = filters.weeks || [];
    const weekExists = currentWeeks.includes(weekValue);

    const newWeeks = weekExists
      ? currentWeeks.filter(w => w !== weekValue)
      : [...currentWeeks, weekValue];

    onFiltersChange({
      ...filters,
      weeks: newWeeks,
    });
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
      <div className="mb-4">
        <label
          htmlFor="viewMode"
          className="block text-sm text-text-secondary mb-2"
        >
          View Mode
        </label>
        <select
          id="viewMode"
          value={filters.viewMode}
          onChange={(e) => handleFilterChange('viewMode', e.target.value)}
          className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
        >
          <option value="cumulative">Cumulative Stats</option>
          <option value="singleGame">Single Game Leaders</option>
        </select>
      </div>

      {filters.viewMode === 'singleGame' ? (
        <div className="mb-4">
          <label
            htmlFor="singleGameCategory"
            className="block text-sm text-text-secondary mb-2"
          >
            Single Game Category
          </label>
          <select
            id="singleGameCategory"
            value={filters.singleGameCategory}
            onChange={(e) => handleFilterChange('singleGameCategory', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="points">Most Points in One Game</option>
            <option value="assists">Most Assists in One Game</option>
            <option value="combined">Most Points + Assists in One Game</option>
          </select>
        </div>
      ) : (
        <>
          <div className="col-span-full mb-4">
            <label className="block text-sm text-text-secondary mb-2">
              Filter by Week
            </label>
            {isLoadingWeeks ? (
              <div className="text-sm text-text-secondary">Loading weeks...</div>
            ) : availableWeeks.length === 0 ? (
              <div className="text-sm text-text-secondary">
                No weeks assigned yet. Assign weeks to sessions to filter by week.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableWeeks.map((week) => {
                  const isSelected = filters.weeks.includes(week.toString());
                  return (
                    <button
                      key={week}
                      type="button"
                      onClick={() => handleWeeksChange(week.toString())}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-accent-primary text-white'
                          : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70'
                      }`}
                    >
                      Week {week}
                    </button>
                  );
                })}
                {filters.weeks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, weeks: [] })}
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="teamFilter"
            className="block text-sm text-text-secondary mb-2"
          >
            Filter by Team
          </label>
          <select
            id="teamFilter"
            value={filters.teamId}
            onChange={(e) => handleFilterChange('teamId', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="">All Players</option>
            {isLoadingTeams ? (
              <option>Loading...</option>
            ) : (
              teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} players only
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="opponentTeam"
            className="block text-sm text-text-secondary mb-2"
          >
            Opponent Team
          </label>
          <select
            id="opponentTeam"
            value={filters.opponentTeamId}
            onChange={(e) => handleFilterChange('opponentTeamId', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="">All Teams</option>
            {isLoadingTeams ? (
              <option>Loading...</option>
            ) : (
              teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="sortBy"
            className="block text-sm text-text-secondary mb-2"
          >
            Sort By
          </label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) =>
              handleFilterChange('sortBy', e.target.value)
            }
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="goals">Goals</option>
            <option value="assists">Assists</option>
            <option value="combined">Goals + Assists</option>
            <option value="goalsPerGame">Goals/Game</option>
            <option value="assistsPerGame">Assists/Game</option>
            <option value="combinedPerGame">Goals + Assists/Game</option>
          </select>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

