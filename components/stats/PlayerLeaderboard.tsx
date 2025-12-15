'use client';

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

interface PlayerLeaderboardProps {
  stats: PlayerStats[];
  viewMode: 'cumulative' | 'singleGame';
  singleGameCategory: 'points' | 'assists' | 'combined';
}

export const PlayerLeaderboard = ({ stats, viewMode, singleGameCategory }: PlayerLeaderboardProps) => {
  if (stats.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center text-text-secondary">
        No statistics available for the selected filters.
      </div>
    );
  }

  const getCategoryLabel = () => {
    if (viewMode === 'singleGame') {
      if (singleGameCategory === 'points') return 'Points in Game';
      if (singleGameCategory === 'assists') return 'Assists in Game';
      if (singleGameCategory === 'combined') return 'Points + Assists';
    }
    return '';
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-bg-primary border-b border-border">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider"
              >
                Rank
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-semibold text-text-secondary uppercase tracking-wider"
              >
                Player Name
              </th>
              {viewMode === 'singleGame' ? (
                <>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    {getCategoryLabel()}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Goals
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Assists
                  </th>
                </>
              ) : (
                <>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Goals
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Assists
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Games Played
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Points/Game
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-sm font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Assists/Game
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((player, index) => {
              const isTopThree = index < 3;
              return (
                <tr
                  key={player.playerName}
                  className="transition-colors hover:bg-bg-tertiary/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-bold ${isTopThree ? 'text-accent-secondary' : 'text-text-primary'}`}>
                      {index + 1}
                    </span>
                    {index === 0 && (
                      <span className="ml-2 text-xl" aria-label="Top player">
                        🥇
                      </span>
                    )}
                    {index === 1 && (
                      <span className="ml-2 text-xl" aria-label="Second place">
                        🥈
                      </span>
                    )}
                    {index === 2 && (
                      <span className="ml-2 text-xl" aria-label="Third place">
                        🥉
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {player.playerName}
                  </td>
                  {viewMode === 'singleGame' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-accent-secondary text-right">
                        {player.singleGameValue ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {player.goals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {player.assists}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-accent-secondary text-right">
                        {player.goals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {player.assists}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {player.gamesPlayed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {player.pointsPerGame?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {player.assistsPerGame?.toFixed(2) ?? '0.00'}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};




