'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditTeamModal } from './EditTeamModal';
import { AddMemberModal } from './AddMemberModal';
import { AddPlayerModal } from './AddPlayerModal';

interface Team {
  id: string;
  name: string;
  color: string;
  creator: {
    id: string;
    username: string;
  };
  members: Array<{
    userId: string;
    isAdmin: boolean;
    user: {
      id: string;
      username: string;
    };
  }>;
  players: Array<{
    id: string;
    name: string;
  }>;
}

interface TeamDetailProps {
  teamId: string;
  userId: string;
}

export const TeamDetail = ({ teamId, userId }: TeamDetailProps) => {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/teams');
          return;
        }
        throw new Error('Failed to fetch team');
      }
      const data = await response.json();
      setTeam(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      router.push('/teams');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleToggleAdmin = async (memberUserId: string, currentIsAdmin: boolean) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member');
      }

      fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update member');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete player');
      }

      fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete player');
    }
  };

  const isCreator = team?.creator.id === userId;
  const isAdmin = team?.members.some(
    (m) => m.userId === userId && (m.isAdmin || isCreator)
  );

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-text-tertiary">Loading team...</div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="p-4 bg-bg-tertiary border border-border rounded-md text-text-primary">
          {error || 'Team not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex-shrink-0"
              style={{ backgroundColor: team.color }}
              aria-label={`Team color: ${team.color}`}
            />
            <div>
              <h2 className="text-3xl font-bold text-text-primary">{team.name}</h2>
              <p className="text-sm text-text-secondary mt-1">Created by {team.creator.username}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-tertiary border border-border rounded-md hover:bg-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-bg-primary"
              >
                Edit
              </button>
              {isCreator && (
                <button
                  onClick={handleDeleteTeam}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-bg-primary"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-text-primary">Members</h3>
            {isAdmin && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-3 py-1 text-sm font-medium text-white bg-accent-primary rounded-md hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-bg-primary"
              >
                Add Member
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {team.members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between p-3 bg-bg-tertiary rounded-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-text-primary font-medium">{member.user.username}</span>
                  {member.isAdmin && (
                    <span className="px-2 py-0.5 text-xs font-medium text-accent-secondary bg-accent-bg border border-accent-border rounded">
                      Admin
                    </span>
                  )}
                  {member.userId === team.creator.id && (
                    <span className="px-2 py-0.5 text-xs font-medium text-accent-secondary bg-accent-bg border border-accent-border rounded">
                      Creator
                    </span>
                  )}
                </div>
                {isAdmin && member.userId !== userId && member.userId !== team.creator.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAdmin(member.userId, member.isAdmin)}
                      className="text-xs text-accent-secondary hover:text-accent-primary"
                    >
                      {member.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-text-primary">Players</h3>
            {isAdmin && (
              <button
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="px-3 py-1 text-sm font-medium text-white bg-accent-primary rounded-md hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-bg-primary"
              >
                Add Player
              </button>
            )}
          </div>
          {team.players.length === 0 ? (
            <p className="text-text-tertiary text-sm">No players added yet.</p>
          ) : (
            <ul className="space-y-2">
              {team.players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-bg-tertiary rounded-md"
                >
                  <span className="text-text-primary">{player.name}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <EditTeamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchTeam}
        team={team}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={fetchTeam}
        teamId={teamId}
      />

      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onSuccess={fetchTeam}
        teamId={teamId}
      />
    </div>
  );
};



