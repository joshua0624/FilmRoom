'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  color: string;
  players?: Array<{
    id: string;
    name: string;
  }>;
}

interface Point {
  id: string;
  timestamp: number;
  teamId: string | null;
  teamIdentifier: string;
  scorerName: string | null;
  assisterName: string | null;
  notes: string | null;
}

interface EditPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: Point;
  teamA: Team | null;
  teamB: Team | null;
  teamACustomName: string | null;
  teamBCustomName: string | null;
  teamAColor: string;
  teamBColor: string;
  onSuccess: (point: any) => void;
}

export const EditPointModal = ({
  isOpen,
  onClose,
  point,
  teamA,
  teamB,
  teamACustomName,
  teamBCustomName,
  teamAColor,
  teamBColor,
  onSuccess,
}: EditPointModalProps) => {
  const [teamIdentifier, setTeamIdentifier] = useState<'A' | 'B'>(
    point.teamIdentifier as 'A' | 'B'
  );
  const [teamId, setTeamId] = useState<string>(point.teamId || '');
  const [scorerName, setScorerName] = useState(point.scorerName || '');
  const [assisterName, setAssisterName] = useState(point.assisterName || '');
  const [notes, setNotes] = useState(point.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTeamIdentifier(point.teamIdentifier as 'A' | 'B');
      setTeamId(point.teamId || '');
      setScorerName(point.scorerName || '');
      setAssisterName(point.assisterName || '');
      setNotes(point.notes || '');
    }
  }, [isOpen, point]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const sessionId = window.location.pathname.split('/')[2];
      const response = await fetch(
        `/api/sessions/${sessionId}/points/${point.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: teamId || null,
            teamIdentifier,
            scorerName: scorerName || null,
            assisterName: assisterName || null,
            notes: notes || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update point');
      }

      const data = await response.json();
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeam = teamIdentifier === 'A' ? teamA : teamB;
  const teamName =
    teamIdentifier === 'A'
      ? teamA?.name || teamACustomName || 'Team A'
      : teamB?.name || teamBCustomName || 'Team B';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Point</h2>
        <p className="text-sm text-gray-600 mb-4">
          Time: {formatTime(point.timestamp)}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="A"
                  checked={teamIdentifier === 'A'}
                  onChange={(e) => {
                    setTeamIdentifier('A');
                    setTeamId(teamA?.id || '');
                  }}
                  className="mr-2"
                />
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: teamAColor }}
                />
                {teamA?.name || teamACustomName || 'Team A'}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="B"
                  checked={teamIdentifier === 'B'}
                  onChange={(e) => {
                    setTeamIdentifier('B');
                    setTeamId(teamB?.id || '');
                  }}
                  className="mr-2"
                />
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: teamBColor }}
                />
                {teamB?.name || teamBCustomName || 'Team B'}
              </label>
            </div>
          </div>

          {selectedTeam?.players && selectedTeam.players.length > 0 && (
            <>
              <div className="mb-4">
                <label
                  htmlFor="scorerName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Scorer (optional)
                </label>
                <select
                  id="scorerName"
                  value={scorerName}
                  onChange={(e) => setScorerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select scorer</option>
                  {selectedTeam.players.map((player) => (
                    <option key={player.id} value={player.name}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="assisterName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Assister (optional)
                </label>
                <select
                  id="assisterName"
                  value={assisterName}
                  onChange={(e) => setAssisterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select assister</option>
                  {selectedTeam.players.map((player) => (
                    <option key={player.id} value={player.name}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about this point..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Point'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



