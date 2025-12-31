'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';

interface League {
  id: string;
  name: string;
  isPublic: boolean;
}

interface Team {
  id: string;
  name: string;
  leagueId: string;
  creatorId: string;
}

interface MigrateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  userId: string;
  onSuccess: () => void;
}

export const MigrateTeamModal = ({
  isOpen,
  onClose,
  team,
  userId,
  onSuccess,
}: MigrateTeamModalProps) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      if (!isOpen) return;

      try {
        setIsLoadingLeagues(true);
        const response = await fetch('/api/leagues');
        if (response.ok) {
          const data = await response.json();
          setLeagues(data);
        }
      } catch (err) {
        console.error('Error fetching leagues:', err);
        toast.error('Failed to load leagues');
      } finally {
        setIsLoadingLeagues(false);
      }
    };

    fetchLeagues();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedLeagueId('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!team) return;

    if (!selectedLeagueId) {
      setError('Please select a target league');
      return;
    }

    if (selectedLeagueId === team.leagueId) {
      setError('Team is already in this league');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${team.id}/migrate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetLeagueId: selectedLeagueId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to migrate team');
      }

      toast.success('Team migrated successfully!');
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
    setSelectedLeagueId('');
    setError(null);
    onClose();
  };

  if (!team) return null;

  const availableLeagues = leagues.filter((league) => league.id !== team.leagueId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Migrate Team to Different League"
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
            disabled={isLoading || !selectedLeagueId}
            type="button"
          >
            {isLoading ? 'Migrating...' : 'Migrate Team'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4 p-3 bg-bg-tertiary border border-border rounded-md">
          <p className="text-sm text-text-secondary mb-1">Migrating team:</p>
          <p className="text-base font-semibold text-text-primary">{team.name}</p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="targetLeague"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Target League *
          </label>
          {isLoadingLeagues ? (
            <div className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-tertiary">
              Loading leagues...
            </div>
          ) : availableLeagues.length === 0 ? (
            <div className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-tertiary">
              No other leagues available. Create a new league first.
            </div>
          ) : (
            <select
              id="targetLeague"
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="">Select a league</option>
              {availableLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} {!league.isPublic && '(Private)'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
          <p className="text-sm text-yellow-600">
            <strong>Warning:</strong> Migrating this team will move it to the selected
            league. All team members, players, and associated data will be moved with it.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};
