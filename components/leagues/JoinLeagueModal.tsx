'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  color: string;
  _count: {
    members: number;
  };
}

interface League {
  id: string;
  name: string;
  isPublic: boolean;
}

interface JoinLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League | null;
  onSuccess: () => void;
}

export const JoinLeagueModal = ({
  isOpen,
  onClose,
  league,
  onSuccess,
}: JoinLeagueModalProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!isOpen || !league) return;

      try {
        setIsLoadingTeams(true);
        const response = await fetch(`/api/leagues/${league.id}/teams`);
        if (response.ok) {
          const data = await response.json();
          setTeams(data);

          // Default to existing team mode if teams exist
          if (data.length > 0) {
            setMode('existing');
          } else {
            setMode('new');
          }
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [isOpen, league]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTeamId('');
      setNewTeamName('');
      setNewTeamColor('#3b82f6');
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!league) return;

    // Validation
    if (mode === 'existing' && !selectedTeamId) {
      setError('Please select a team');
      return;
    }

    if (mode === 'new' && !newTeamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    if (!league.isPublic && !password) {
      setError('Password is required for private leagues');
      return;
    }

    setIsLoading(true);

    try {
      const body: any = {
        password: password || undefined,
      };

      if (mode === 'existing') {
        body.teamId = selectedTeamId;
      } else {
        body.teamName = newTeamName.trim();
        body.teamColor = newTeamColor;
      }

      const response = await fetch(`/api/leagues/${league.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join league');
      }

      toast.success('Successfully joined league!');
      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTeamId('');
    setNewTeamName('');
    setNewTeamColor('#3b82f6');
    setPassword('');
    setError(null);
    onClose();
  };

  if (!league) return null;

  const teamColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Join ${league.name}`}
      maxWidth="500px"
      footer={
        <div className="flex gap-3">
          <Button variant="tertiary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Joining...' : 'Join League'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {!league.isPublic && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
            <p className="text-sm text-yellow-600">
              This is a private league. You'll need the password to join.
            </p>
          </div>
        )}

        {isLoadingTeams ? (
          <div className="mb-4 py-8 text-center text-text-tertiary">
            Loading teams...
          </div>
        ) : (
          <>
            {teams.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  How would you like to join?
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="joinMode"
                      value="existing"
                      checked={mode === 'existing'}
                      onChange={() => setMode('existing')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-text-primary">
                      Join an existing team
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="joinMode"
                      value="new"
                      checked={mode === 'new'}
                      onChange={() => setMode('new')}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-text-primary">
                      Create a new team
                    </span>
                  </label>
                </div>
              </div>
            )}

            {mode === 'existing' && teams.length > 0 ? (
              <div className="mb-4">
                <label
                  htmlFor="team"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Select Team *
                </label>
                <select
                  id="team"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="">Choose a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team._count.members} members)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-text-primary mb-2"
                  >
                    Team Name *
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                    maxLength={50}
                    className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
                    placeholder="Enter team name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Team Color
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {teamColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewTeamColor(color.value)}
                        className={`px-3 py-2 rounded-md border-2 transition-all ${
                          newTeamColor === color.value
                            ? 'border-accent-primary scale-105'
                            : 'border-border hover:border-text-tertiary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-sm text-text-primary">
                            {color.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {!league.isPublic && (
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              League Password *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary"
              placeholder="Enter league password"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};
