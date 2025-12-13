'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Point {
  id: string;
  teamIdentifier: string;
}

interface ScoreDisplayProps {
  sessionId: string;
  points: Point[];
  teamAColor: string;
  teamBColor: string;
  teamAName: string;
  teamBName: string;
}

export const ScoreDisplay = ({
  sessionId,
  points,
  teamAColor,
  teamBColor,
  teamAName,
  teamBName,
}: ScoreDisplayProps) => {
  const [localPoints, setLocalPoints] = useState<Point[]>(points);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    setLocalPoints(points);
  }, [points]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-session', sessionId);
    });

    newSocket.on('point-created', (point: Point) => {
      setLocalPoints((prev) => {
        if (prev.some((p) => p.id === point.id)) {
          return prev;
        }
        return [...prev, point].sort((a, b) => {
          // Sort by timestamp if available, otherwise by id
          return a.id.localeCompare(b.id);
        });
      });
    });

    newSocket.on('point-deleted', (pointId: string) => {
      setLocalPoints((prev) => prev.filter((p) => p.id !== pointId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId]);

  // Calculate scores
  const teamAScore = localPoints.filter((p) => p.teamIdentifier === 'A').length;
  const teamBScore = localPoints.filter((p) => p.teamIdentifier === 'B').length;

  return (
    <div className="bg-bg-primary border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-border"
            style={{ backgroundColor: teamAColor }}
            aria-label={`${teamAName} color`}
          />
          <span className="text-lg font-semibold text-text-primary">
            {teamAName}: <span className="text-3xl font-bold text-accent-secondary">{teamAScore}</span>
          </span>
        </div>
        <div className="text-text-tertiary text-xl">vs</div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-text-primary">
            <span className="text-3xl font-bold text-accent-secondary">{teamBScore}</span> : {teamBName}
          </span>
          <div
            className="w-6 h-6 rounded-full border-2 border-border"
            style={{ backgroundColor: teamBColor }}
            aria-label={`${teamBName} color`}
          />
        </div>
      </div>
    </div>
  );
};

