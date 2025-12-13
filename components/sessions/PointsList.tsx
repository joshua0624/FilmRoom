'use client';

import { useState } from 'react';
import { EditPointModal } from './EditPointModal';

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
  markedBy: {
    id: string;
    username: string;
  };
  createdAt: string;
}

interface PointsListProps {
  points: Point[];
  teamA: Team | null;
  teamB: Team | null;
  teamACustomName: string | null;
  teamBCustomName: string | null;
  teamAColor: string;
  teamBColor: string;
  userId: string;
  onPointClick: (timestamp: number) => void;
  onPointUpdated: (point: Point) => void;
  onPointDeleted: (pointId: string) => void;
  readOnly?: boolean;
}

export const PointsList = ({
  points,
  teamA,
  teamB,
  teamACustomName,
  teamBCustomName,
  teamAColor,
  teamBColor,
  userId,
  onPointClick,
  onPointUpdated,
  onPointDeleted,
  readOnly = false,
}: PointsListProps) => {
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (pointId: string) => {
    if (!confirm('Are you sure you want to delete this point?')) {
      return;
    }

    try {
      const sessionId = window.location.pathname.split('/')[2];
      const response = await fetch(
        `/api/sessions/${sessionId}/points/${pointId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete point');
      }

      onPointDeleted(pointId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete point');
    }
  };

  const getTeamName = (teamIdentifier: string) => {
    if (teamIdentifier === 'A') {
      return teamA?.name || teamACustomName || 'Team A';
    }
    return teamB?.name || teamBCustomName || 'Team B';
  };

  const getTeamColor = (teamIdentifier: string) => {
    return teamIdentifier === 'A' ? teamAColor : teamBColor;
  };

  if (points.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Points Timeline
        </h3>
        <p className="text-text-secondary text-sm">No points marked yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Points Timeline
      </h3>
      <div className="space-y-3">
        {points
          .filter((point, index, self) => 
            index === self.findIndex((p) => p.id === point.id)
          )
          .map((point) => (
            <div
              key={point.id}
              className="flex items-start gap-3 p-3 bg-bg-primary rounded cursor-pointer transition-colors hover:bg-bg-tertiary/50"
              onClick={() => onPointClick(point.timestamp)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPointClick(point.timestamp);
                }
              }}
            >
              <div
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{
                  backgroundColor: getTeamColor(point.teamIdentifier),
                }}
                aria-label={`${getTeamName(point.teamIdentifier)} color`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-accent-secondary font-medium">
                    {formatTime(point.timestamp)}
                  </span>
                  <span className="text-text-tertiary">•</span>
                  <span className="font-medium text-text-primary">{point.scorerName || 'Unknown'}</span>
                  {point.assisterName && (
                    <>
                      <span className="text-text-secondary text-sm">←</span>
                      <span className="text-text-secondary text-sm">{point.assisterName}</span>
                    </>
                  )}
                </div>
                {point.notes && (
                  <p className="text-sm text-text-secondary mb-1">{point.notes}</p>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingPoint(point)}
                    className="text-xs text-accent-secondary hover:text-accent-primary transition-colors p-1"
                    aria-label="Edit point"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(point.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors p-1"
                    aria-label="Delete point"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {editingPoint && (
        <EditPointModal
          isOpen={true}
          onClose={() => setEditingPoint(null)}
          point={editingPoint}
          teamA={teamA}
          teamB={teamB}
          teamACustomName={teamACustomName}
          teamBCustomName={teamBCustomName}
          teamAColor={teamAColor}
          teamBColor={teamBColor}
          onSuccess={(updatedPoint) => {
            onPointUpdated(updatedPoint);
            setEditingPoint(null);
          }}
        />
      )}
    </div>
  );
};

