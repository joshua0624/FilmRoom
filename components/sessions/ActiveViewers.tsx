'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ActiveViewer {
  sessionId: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
  canMarkPoints: boolean;
  joinedAt: string;
  lastActive: string;
}

interface ActiveViewersProps {
  sessionId: string;
  currentUserId: string;
}

export const ActiveViewers = ({
  sessionId,
  currentUserId,
}: ActiveViewersProps) => {
  const [viewers, setViewers] = useState<ActiveViewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchViewers = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/viewers`);
      if (response.ok) {
        const data = await response.json();
        setViewers(data);
      }
    } catch (error) {
      console.error('Error fetching viewers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViewers();
    const interval = setInterval(fetchViewers, 5000); // Refresh every 5 seconds

    // Initialize socket connection for real-time updates
    const newSocket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (sessionId) {
        newSocket.emit('join-session', sessionId);
      }
      // Refresh viewers on reconnect
      fetchViewers();
    });

    newSocket.on('disconnect', () => {
      // Viewers will be cleaned up by the API when they're inactive
      // We'll refresh on reconnect
    });

    newSocket.on('viewer-joined', () => {
      fetchViewers();
    });

    newSocket.on('viewer-left', () => {
      fetchViewers();
    });

    newSocket.on('point-permission-changed', () => {
      fetchViewers();
    });

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-text-tertiary" />
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Active Viewers</h3>
        </div>
        <div className="text-sm text-text-secondary">Loading...</div>
      </div>
    );
  }

  const activeViewers = viewers.filter((viewer) => viewer.user.id !== currentUserId);
  const currentUser = viewers.find((viewer) => viewer.user.id === currentUserId);

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4" role="region" aria-label="Active viewers">
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3" id="active-viewers-heading">
        Active Viewers
      </h3>
      <div className="space-y-2" role="list" aria-labelledby="active-viewers-heading">
        {currentUser && (
          <div 
            className="flex items-center justify-between text-sm"
            role="listitem"
            aria-label={`You, ${currentUser.user.username}${currentUser.canMarkPoints ? ', can mark points' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#22c55e] rounded-full" aria-hidden="true" />
              <span className="text-text-primary">
                {currentUser.user.username}
              </span>
            </div>
            {currentUser.canMarkPoints && (
              <span className="text-xs text-accent-secondary" aria-label="Can mark points">
                Can Mark
              </span>
            )}
          </div>
        )}
        {activeViewers.length > 0 ? (
          activeViewers.map((viewer) => (
            <div
              key={viewer.user.id}
              className="flex items-center justify-between text-sm"
              role="listitem"
              aria-label={`${viewer.user.username}${viewer.canMarkPoints ? ', can mark points' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full" aria-hidden="true" />
                <span className="text-text-primary">{viewer.user.username}</span>
              </div>
              {viewer.canMarkPoints && (
                <span className="text-xs text-accent-secondary" aria-label="Can mark points">
                  Can Mark
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-text-secondary py-2" role="status" aria-live="polite">
            {currentUser ? 'No other viewers' : 'No active viewers'}
          </div>
        )}
      </div>
    </div>
  );
};

