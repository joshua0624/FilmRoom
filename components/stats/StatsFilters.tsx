'use client';

import { useEffect, useState } from 'react';

interface Team {
  id: string;
  name: string;
}

interface StatsFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    opponentTeamId: string;
    sortBy: 'goals' | 'assists';
    minPointsPerGame: string;
    maxPointsPerGame: string;
    minAssistsPerGame: string;
    maxAssistsPerGame: string;
    viewMode: 'cumulative' | 'singleGame';
    singleGameCategory: 'points' | 'assists' | 'combined';
  };
  onFiltersChange: (filters: {
    startDate: string;
    endDate: string;
    opponentTeamId: string;
    sortBy: 'goals' | 'assists';
    minPointsPerGame: string;
    maxPointsPerGame: string;
    minAssistsPerGame: string;
    maxAssistsPerGame: string;
    viewMode: 'cumulative' | 'singleGame';
    singleGameCategory: 'points' | 'assists' | 'combined';
  }) => void;
}

export const StatsFilters = ({ filters, onFiltersChange }: StatsFiltersProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
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
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm text-text-secondary mb-2"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm text-text-secondary mb-2"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          />
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
              handleFilterChange('sortBy', e.target.value as 'goals' | 'assists')
            }
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="goals">Goals</option>
            <option value="assists">Assists</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="minPointsPerGame"
            className="block text-sm text-text-secondary mb-2"
          >
            Min Points Per Game
          </label>
          <input
            type="number"
            id="minPointsPerGame"
            min="0"
            step="0.1"
            value={filters.minPointsPerGame}
            onChange={(e) => handleFilterChange('minPointsPerGame', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
            placeholder="0.0"
          />
        </div>

        <div>
          <label
            htmlFor="maxPointsPerGame"
            className="block text-sm text-text-secondary mb-2"
          >
            Max Points Per Game
          </label>
          <input
            type="number"
            id="maxPointsPerGame"
            min="0"
            step="0.1"
            value={filters.maxPointsPerGame}
            onChange={(e) => handleFilterChange('maxPointsPerGame', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
            placeholder="∞"
          />
        </div>

        <div>
          <label
            htmlFor="minAssistsPerGame"
            className="block text-sm text-text-secondary mb-2"
          >
            Min Assists Per Game
          </label>
          <input
            type="number"
            id="minAssistsPerGame"
            min="0"
            step="0.1"
            value={filters.minAssistsPerGame}
            onChange={(e) => handleFilterChange('minAssistsPerGame', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
            placeholder="0.0"
          />
        </div>

        <div>
          <label
            htmlFor="maxAssistsPerGame"
            className="block text-sm text-text-secondary mb-2"
          >
            Max Assists Per Game
          </label>
          <input
            type="number"
            id="maxAssistsPerGame"
            min="0"
            step="0.1"
            value={filters.maxAssistsPerGame}
            onChange={(e) => handleFilterChange('maxAssistsPerGame', e.target.value)}
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent-primary"
            placeholder="∞"
          />
        </div>
      </div>
        </>
      )}
    </div>
  );
};

