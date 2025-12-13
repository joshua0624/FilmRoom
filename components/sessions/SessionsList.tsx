'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateSessionModal } from './CreateSessionModal';
import { SessionCard } from './SessionCard';
import { ListSkeleton } from '@/components/common/SkeletonLoader';
import { Button } from '@/components/common/Button';

interface FilmSession {
  id: string;
  youtubeUrl: string;
  teamAId: string | null;
  teamBId: string | null;
  teamACustomName: string | null;
  teamBCustomName: string | null;
  teamAColor: string;
  teamBColor: string;
  createdAt: string;
  shareToken: string;
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
}

export const SessionsList = () => {
  const router = useRouter();
  const [sessions, setSessions] = useState<FilmSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSuccess = (sessionId: string) => {
    fetchSessions();
    router.push(`/sessions/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-primary">Film Sessions</h2>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Create Session
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-500">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No sessions yet
          </h3>
          <p className="text-text-secondary mb-4">
            Get started by creating your first film session.
          </p>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            Create Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};


