'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Trash2, Edit } from 'lucide-react';
import { EditSessionWeekModal } from './EditSessionWeekModal';

interface SessionCardProps {
  session: {
    id: string;
    youtubeUrl: string;
    teamAId: string | null;
    teamBId: string | null;
    teamACustomName: string | null;
    teamBCustomName: string | null;
    teamAColor: string;
    teamBColor: string;
    createdAt: string;
    week: number | null;
    teamA: {
      id: string;
      name: string;
      color: string;
    } | null;
    teamB: {
      id: string;
      name: string;
      color: string;
    } | null;
    creator: {
      id: string;
      username: string;
    };
    _count: {
      points: number;
      notes: number;
    };
  };
  userId?: string;
  onDelete?: (sessionId: string) => void;
  onWeekUpdate?: (sessionId: string, week: number | null) => void;
}

export const SessionCard = ({ session, userId, onDelete, onWeekUpdate }: SessionCardProps) => {
  const router = useRouter();
  const isCreator = userId === session.creator.id;
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState(false);

  const handleClick = () => {
    router.push(`/sessions/${session.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    if (!onDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      onDelete(session.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleWeekUpdate = (updatedWeek: number | null) => {
    if (onWeekUpdate) {
      onWeekUpdate(session.id, updatedWeek);
    }
  };

  const teamAName = session.teamA?.name || session.teamACustomName || 'Team A';
  const teamBName = session.teamB?.name || session.teamBCustomName || 'Team B';

  return (
    <div
      onClick={handleClick}
      className="bg-bg-secondary border border-border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:border-[#3d3d3d] hover:-translate-y-0.5 relative"
      role="button"
      tabIndex={0}
      aria-label={`View session: ${teamAName} vs ${teamBName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {isCreator && onDelete && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditWeekModalOpen(true);
            }}
            className="p-2 text-text-tertiary hover:text-blue-500 transition-colors rounded-md hover:bg-blue-500/10"
            aria-label="Edit week"
            tabIndex={0}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-text-tertiary hover:text-red-500 transition-colors rounded-md hover:bg-red-500/10"
            aria-label="Delete session"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(e as unknown as React.MouseEvent);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: session.teamAColor }}
          aria-label={`${teamAName} color`}
        />
        <span className="text-sm font-medium text-text-primary">{teamAName}</span>
        <span className="text-sm text-text-secondary">vs</span>
        <span className="text-sm font-medium text-text-primary">{teamBName}</span>
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 ml-auto"
          style={{ backgroundColor: session.teamBColor }}
          aria-label={`${teamBName} color`}
        />
      </div>

      <div className="text-xs text-text-tertiary mb-3">
        Created {format(new Date(session.createdAt), 'MMM d, yyyy')} by{' '}
        {session.creator.username}
        {session.week && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            Week {session.week}
          </span>
        )}
      </div>

      <div className="flex gap-4 text-sm text-text-secondary">
        <span>{session._count.points} points</span>
        <span>{session._count.notes} notes</span>
      </div>

      <EditSessionWeekModal
        isOpen={isEditWeekModalOpen}
        onClose={() => setIsEditWeekModalOpen(false)}
        sessionId={session.id}
        currentWeek={session.week}
        onSuccess={handleWeekUpdate}
      />
    </div>
  );
};





