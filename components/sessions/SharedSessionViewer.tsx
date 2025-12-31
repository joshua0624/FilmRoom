'use client';

import { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { io, Socket } from 'socket.io-client';
import { PointMarker } from './PointMarker';
import { NotesPanel } from './NotesPanel';
import { PointsList } from './PointsList';
import { SessionSkeleton } from '../common/SkeletonLoader';

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

interface Note {
  id: string;
  sessionId: string;
  timestamp: number;
  title: string;
  content: string;
  visibility: 'PUBLIC' | 'TEAM_ONLY';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
  };
}

interface FilmSession {
  id: string;
  youtubeUrl: string;
  teamAId: string | null;
  teamBId: string | null;
  teamACustomName: string | null;
  teamBCustomName: string | null;
  teamAColor: string;
  teamBColor: string;
  shareToken: string;
  teamA: Team | null;
  teamB: Team | null;
  creator: {
    id: string;
    username: string;
  };
  points: Point[];
  notes: Note[];
}

interface SharedSessionViewerProps {
  shareToken: string;
  userId?: string;
}

export const SharedSessionViewer = ({
  shareToken,
  userId,
}: SharedSessionViewerProps) => {
  const [session, setSession] = useState<FilmSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isRetryingVideo, setIsRetryingVideo] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    fetchSession();

    // Initialize Socket.io connection
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('point-created', (point: Point) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          points: [...prev.points, point].sort(
            (a, b) => a.timestamp - b.timestamp
          ),
        };
      });
    });

    newSocket.on('point-updated', (point: Point) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          points: prev.points
            .map((p) => (p.id === point.id ? point : p))
            .sort((a, b) => a.timestamp - b.timestamp),
        };
      });
    });

    newSocket.on('point-deleted', (pointId: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          points: prev.points.filter((p) => p.id !== pointId),
        };
      });
    });

    newSocket.on('note-created', (note: Note) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: [...prev.notes, note].sort(
            (a, b) => a.timestamp - b.timestamp
          ),
        };
      });
    });

    newSocket.on('note-updated', (note: Note) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: prev.notes
            .map((n) => (n.id === note.id ? note : n))
            .sort((a, b) => a.timestamp - b.timestamp),
        };
      });
    });

    newSocket.on('note-deleted', (noteId: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: prev.notes.filter((n) => n.id !== noteId),
        };
      });
    });

    newSocket.on('playback-sync', (data: { time: number; playing: boolean }) => {
      if (playerRef.current) {
        const currentPlayerTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentPlayerTime - data.time);
        if (timeDiff > 1) {
          playerRef.current.seekTo(data.time, true);
        }
        if (data.playing && playerRef.current.getPlayerState() !== 1) {
          playerRef.current.playVideo();
        } else if (!data.playing && playerRef.current.getPlayerState() === 1) {
          playerRef.current.pauseVideo();
        }
      }
    });

    newSocket.on('viewer-joined', () => {
      // Refresh viewers list when someone joins
    });

    newSocket.on('viewer-left', () => {
      // Refresh viewers list when someone leaves
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join session for read-only viewing (no active viewer registration)
  useEffect(() => {
    if (!session?.id || !socket) return;

    socket.emit('join-session', session.id);

    return () => {
      socket.emit('leave-session', session.id);
    };
  }, [session?.id, socket]);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions/share/${shareToken}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      const data = await response.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    playerRef.current = event.target;
    setVideoError(null);
    setIsRetryingVideo(false);
  };

  const handlePlayerError: YouTubeProps['onError'] = (event) => {
    const errorCode = event.data;
    let errorMessage = 'An error occurred while loading the video';
    
    switch (errorCode) {
      case 2:
        errorMessage = 'Invalid video ID. Please check the YouTube URL.';
        break;
      case 5:
        errorMessage = 'The video is private or restricted. Please use a public video.';
        break;
      case 100:
        errorMessage = 'Video not found. The video may have been deleted or is unavailable.';
        break;
      case 101:
      case 150:
        errorMessage = 'The video is not allowed to be played in embedded players.';
        break;
      default:
        errorMessage = 'Unable to load video. Please check your internet connection and try again.';
    }
    
    setVideoError(errorMessage);
  };

  const handleStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (socket && session && event.data === 1) {
      // Playing
      const currentTime = event.target.getCurrentTime();
      socket.emit('playback-update', {
        sessionId: session.id,
        time: currentTime,
        playing: true,
      });
    } else if (socket && session && event.data === 2) {
      // Paused
      const currentTime = event.target.getCurrentTime();
      socket.emit('playback-update', {
        sessionId: session.id,
        time: currentTime,
        playing: false,
      });
    }
  };

  const handleTimeUpdate = () => {
    if (player) {
      const time = player.getCurrentTime();
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleTimeUpdate();
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  const handlePointClick = (timestamp: number) => {
    if (player) {
      player.seekTo(timestamp, true);
      player.playVideo();
    }
  };

  const handleNoteClick = (timestamp: number) => {
    if (player) {
      player.seekTo(timestamp, true);
      player.playVideo();
    }
  };

  const extractVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (isLoading) {
    return <SessionSkeleton />;
  }

  if (error || !session) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'Session not found'}
        </div>
      </div>
    );
  }

  const videoId = extractVideoId(session.youtubeUrl);
  const teamAName = session.teamA?.name || session.teamACustomName || 'Team A';
  const teamBName = session.teamB?.name || session.teamBCustomName || 'Team B';

  const opts: YouTubeProps['opts'] = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: session.teamAColor }}
            aria-label={`${teamAName} color`}
          />
          <h2 className="text-2xl font-bold text-gray-900">
            {teamAName} vs {teamBName}
          </h2>
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: session.teamBColor }}
            aria-label={`${teamBName} color`}
          />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Created by {session.creator.username}
          </p>
          <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            Read-only
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            {videoId ? (
              videoError ? (
                <div 
                  className="relative w-full flex flex-col items-center justify-center p-8"
                  style={{ aspectRatio: '16/9', minHeight: '300px' }}
                >
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto text-red-500 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Video Error
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md">{videoError}</p>
                    <button
                      onClick={() => {
                        setVideoError(null);
                        setIsRetryingVideo(true);
                        setTimeout(() => {
                          setIsRetryingVideo(false);
                        }, 1000);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label="Retry loading video"
                    >
                      {isRetryingVideo ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={handlePlayerReady}
                    onStateChange={handleStateChange}
                    onError={handlePlayerError}
                  />
                <div className="absolute bottom-4 left-4 right-4">
                  {session.points.map((point) => (
                    <PointMarker
                      key={point.id}
                      point={point}
                      currentTime={currentTime}
                      teamAColor={session.teamAColor}
                      teamBColor={session.teamBColor}
                      onClick={() => handlePointClick(point.timestamp)}
                    />
                  ))}
                </div>
              </div>
              )
            ) : (
              <div 
                className="relative w-full flex flex-col items-center justify-center p-8"
                style={{ aspectRatio: '16/9', minHeight: '300px' }}
              >
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Invalid YouTube URL
                  </h3>
                  <p className="text-gray-600">
                    The YouTube URL for this session is invalid or missing.
                  </p>
                </div>
              </div>
            )}
          </div>

          <PointsList
            points={session.points}
            teamA={session.teamA}
            teamB={session.teamB}
            teamACustomName={session.teamACustomName}
            teamBCustomName={session.teamBCustomName}
            teamAColor={session.teamAColor}
            teamBColor={session.teamBColor}
            userId={userId || ''}
            onPointClick={handlePointClick}
            onPointUpdated={() => {}}
            onPointDeleted={() => {}}
            readOnly={true}
          />
        </div>

        <div className="lg:col-span-1 space-y-4">
          <NotesPanel
            notes={session.notes}
            userId={userId || ''}
            onNoteClick={handleNoteClick}
            onNoteUpdated={() => {}}
            onNoteDeleted={() => {}}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
};


