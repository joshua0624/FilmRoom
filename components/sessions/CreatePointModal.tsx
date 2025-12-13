'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface Team {
  id: string;
  name: string;
  color: string;
  players?: Array<{
    id: string;
    name: string;
  }>;
}

interface CreatePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  timestamp: number;
  teamA: Team | null;
  teamB: Team | null;
  teamACustomName: string | null;
  teamBCustomName: string | null;
  teamAColor: string;
  teamBColor: string;
  initialTeamIdentifier?: 'A' | 'B';
  onSuccess: (point: any) => void;
}

export const CreatePointModal = ({
  isOpen,
  onClose,
  sessionId,
  timestamp,
  teamA,
  teamB,
  teamACustomName,
  teamBCustomName,
  teamAColor,
  teamBColor,
  initialTeamIdentifier = 'A',
  onSuccess,
}: CreatePointModalProps) => {
  const [teamIdentifier, setTeamIdentifier] = useState<'A' | 'B'>(initialTeamIdentifier);
  const [teamId, setTeamId] = useState<string>('');
  const [scorerName, setScorerName] = useState('');
  const [assisterName, setAssisterName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize teamId when modal opens or teamIdentifier changes
  useEffect(() => {
    if (isOpen) {
      if (teamIdentifier === 'A') {
        setTeamId(teamA?.id || '');
      } else {
        setTeamId(teamB?.id || '');
      }
    }
  }, [isOpen, teamIdentifier, teamA?.id, teamB?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (timestamp === undefined || timestamp < 0 || isNaN(timestamp)) {
      setError('Invalid timestamp. Please try marking the point again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Number(timestamp),
          teamId: teamId || null,
          teamIdentifier,
          scorerName: scorerName || null,
          assisterName: assisterName || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create point');
      }

      const data = await response.json();
      toast.success('Point marked successfully!');
      onSuccess(data);
      resetForm();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Check if it's a permission error
      if (errorMessage.includes('permission') || errorMessage.includes('Only')) {
        toast.error(errorMessage);
      } else {
        toast.error('Failed to create point. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTeamIdentifier(initialTeamIdentifier);
    }
  }, [isOpen, initialTeamIdentifier]);

  const resetForm = () => {
    setTeamIdentifier(initialTeamIdentifier);
    setTeamId('');
    setScorerName('');
    setAssisterName('');
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedTeam = teamIdentifier === 'A' ? teamA : teamB;
  const teamName =
    teamIdentifier === 'A'
      ? teamA?.name || teamACustomName || 'Team A'
      : teamB?.name || teamBCustomName || 'Team B';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mark Point"
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
            {isLoading ? 'Creating...' : 'Create Point'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-text-secondary mb-4">
          Time: {formatTime(timestamp)}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Team
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
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
              <span className="text-text-primary">
                {teamIdentifier === 'A'
                  ? teamA?.name || teamACustomName || 'Team A'
                  : teamA?.name || teamACustomName || 'Team A'}
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
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
              <span className="text-text-primary">
                {teamIdentifier === 'B'
                  ? teamB?.name || teamBCustomName || 'Team B'
                  : teamB?.name || teamBCustomName || 'Team B'}
              </span>
            </label>
          </div>
        </div>

        {selectedTeam?.players && selectedTeam.players.length > 0 && (
          <>
            <div className="mb-4">
              <label
                htmlFor="scorerName"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Scorer (optional)
              </label>
              <select
                id="scorerName"
                value={scorerName}
                onChange={(e) => setScorerName(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent-primary"
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
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Assister (optional)
              </label>
              <select
                id="assisterName"
                value={assisterName}
                onChange={(e) => setAssisterName(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent-primary"
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
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-tertiary resize-y focus:outline-none focus:border-accent-primary"
            placeholder="Add any notes about this point..."
          />
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

