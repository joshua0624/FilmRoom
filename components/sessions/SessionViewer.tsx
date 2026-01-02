'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import YouTube, { YouTubeProps } from 'react-youtube';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { PointMarker } from './PointMarker';
import { NotesPanel } from './NotesPanel';
import { PointsList } from './PointsList';
import { CreatePointModal } from './CreatePointModal';
import { CreateNoteModal } from './CreateNoteModal';
import { NoteDetailModal } from './NoteDetailModal';
import { ActiveViewers } from './ActiveViewers';
import { ScoreDisplay } from './ScoreDisplay';
import { Timeline } from './Timeline';
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
  leagueId: string;
  teamA: Team | null;
  teamB: Team | null;
  creator: {
    id: string;
    username: string;
  };
  points: Point[];
  notes: Note[];
}

interface SessionViewerProps {
  sessionId: string;
  userId: string;
}

export const SessionViewer = ({ sessionId, userId }: SessionViewerProps) => {
  const router = useRouter();
  const [session, setSession] = useState<FilmSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [player, setPlayer] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isCreatePointModalOpen, setIsCreatePointModalOpen] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isNoteDetailModalOpen, setIsNoteDetailModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(
    null
  );
  const [selectedTeamIdentifier, setSelectedTeamIdentifier] = useState<'A' | 'B'>('A');
  const [canMarkPoints, setCanMarkPoints] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastManualSeek, setLastManualSeek] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Array<() => void>>([]);
  const [skipFeedback, setSkipFeedback] = useState<{ show: boolean; direction: 'back' | 'forward' } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isRetryingVideo, setIsRetryingVideo] = useState(false);
  const [isLeagueAdmin, setIsLeagueAdmin] = useState(false);
  const playerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (session?.id && socket) {
      socket.emit('join-session', session.id);
      // Join as active viewer
      fetch(`/api/sessions/${session.id}/viewers`, {
        method: 'POST',
      }).catch((err) => {
        console.error('Error joining as viewer:', err);
      });
    }
  }, [session?.id, socket]);

  // Allow all users to mark points
  useEffect(() => {
    if (!session) {
      setCanMarkPoints(false);
      return;
    }

    setCanMarkPoints(true);
  }, [session]);

  // Cleanup: remove viewer when component unmounts
  useEffect(() => {
    return () => {
      if (session?.id) {
        fetch(`/api/sessions/${session.id}/viewers`, {
          method: 'DELETE',
        }).catch((err) => {
          console.error('Error leaving as viewer:', err);
        });
      }
    };
  }, [session?.id]);

  // Reconnection logic with exponential backoff
  const attemptReconnect = useCallback((socket: Socket) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setReconnectAttempts((prevAttempts) => {
      const maxAttempts = 10;
      const baseDelay = 1000; // Start with 1 second

      if (prevAttempts >= maxAttempts) {
        console.error('Max reconnection attempts reached');
        setIsReconnecting(false);
        return prevAttempts;
      }

      const delay = Math.min(baseDelay * Math.pow(2, prevAttempts), 30000); // Max 30 seconds
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts((currentAttempts) => currentAttempts + 1);
        socket.connect();
      }, delay);

      return prevAttempts;
    });
  }, []);

  useEffect(() => {
    fetchSession();

    // Initialize Socket.io connection with reconnection settings
    const newSocket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });
    setSocket(newSocket);

    // Handle initial connection
    const handleConnect = () => {
      newSocket.emit('join-session', sessionId);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      
      // Rejoin as active viewer
      if (session?.id) {
        fetch(`/api/sessions/${session.id}/viewers`, {
          method: 'POST',
        }).catch((err) => {
          console.error('Error rejoining as viewer:', err);
        });
      }
      
      // Process any pending changes
      pendingChanges.forEach((change) => {
        try {
          change();
        } catch (err) {
          console.error('Error processing pending change:', err);
        }
      });
      setPendingChanges([]);
    };

    newSocket.on('connect', handleConnect);

    newSocket.on('point-created', (point: Point) => {
      setSession((prev) => {
        if (!prev) return prev;
        // Check if point already exists to avoid duplicates
        if (prev.points.some((p) => p.id === point.id)) {
          return prev;
        }
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
        // Check if note already exists to avoid duplicates
        if (prev.notes.some((n) => n.id === note.id)) {
          return prev;
        }
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
      if (!isSyncEnabled || !playerRef.current) return;
      
      // Don't sync if user recently manually sought (within last 2 seconds)
      if (lastManualSeek && Date.now() - lastManualSeek < 2000) {
        return;
      }

      const currentPlayerTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentPlayerTime - data.time);
      
      // Only sync if time difference > 1 second
      if (timeDiff > 1) {
        playerRef.current.seekTo(data.time, true);
      }
      
      if (data.playing && playerRef.current.getPlayerState() !== 1) {
        playerRef.current.playVideo();
      } else if (!data.playing && playerRef.current.getPlayerState() === 1) {
        playerRef.current.pauseVideo();
      }
    });

    // Handle disconnection and reconnection
    newSocket.on('disconnect', () => {
      setIsReconnecting(true);
      attemptReconnect(newSocket);
    });

    newSocket.on('connect_error', () => {
      setIsReconnecting(true);
      attemptReconnect(newSocket);
    });

    newSocket.on('viewer-joined', () => {
      // Refresh viewers list when someone joins
      // The ActiveViewers component will handle the refresh
    });

    newSocket.on('viewer-left', () => {
      // Refresh viewers list when someone leaves
      // The ActiveViewers component will handle the refresh
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      newSocket.emit('leave-session', sessionId);
      newSocket.disconnect();
    };
  }, [sessionId, session?.id, attemptReconnect]);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/sessions');
          return;
        }
        throw new Error('Failed to fetch session');
      }
      const data = await response.json();
      setSession(data);

      // Check if user is a league admin
      if (data.leagueId) {
        try {
          const adminResponse = await fetch(`/api/leagues/${data.leagueId}/check-admin`);
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            setIsLeagueAdmin(adminData.isAdmin);
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
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
    // Get video duration
    if (event.target) {
      const duration = event.target.getDuration();
      if (duration && !isNaN(duration)) {
        setVideoDuration(duration);
      }
    }
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
    toast.error(errorMessage);
  };

  const handleStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (socket && event.data === 1) {
      // Playing
      const currentTime = event.target.getCurrentTime();
      socket.emit('playback-update', {
        sessionId,
        time: currentTime,
        playing: true,
      });
    } else if (socket && event.data === 2) {
      // Paused
      const currentTime = event.target.getCurrentTime();
      socket.emit('playback-update', {
        sessionId,
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

  // Track manual seeks
  const handleManualSeek = (time: number) => {
    setLastManualSeek(Date.now());
    // Clear the manual seek flag after 2 seconds
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      setLastManualSeek(null);
    }, 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleTimeUpdate();
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  const handleMarkPoint = (teamIdentifier: 'A' | 'B') => {
    const currentPlayer = player || playerRef.current;
    let time = 0;
    
    if (currentPlayer) {
      try {
        const playerTime = currentPlayer.getCurrentTime();
        if (playerTime !== undefined && !isNaN(playerTime) && playerTime >= 0) {
          time = playerTime;
        } else {
          time = currentTime || 0;
        }
      } catch (err) {
        console.error('Error getting current time from player:', err);
        time = currentTime || 0;
      }
    } else {
      time = currentTime || 0;
    }
    
    // Auto-pause video if in fullscreen
    if (isFullscreen && currentPlayer) {
      try {
        currentPlayer.pauseVideo();
      } catch (err) {
        console.error('Error pausing video:', err);
      }
    }
    
    setSelectedTeamIdentifier(teamIdentifier);
    setSelectedTimestamp(time);
    setIsCreatePointModalOpen(true);
  };

  const handleAddNote = () => {
    console.log('handleAddNote called', { player, playerRef: playerRef.current, currentTime });
    const currentPlayer = player || playerRef.current;
    let time = 0;
    
    if (currentPlayer) {
      try {
        const playerTime = currentPlayer.getCurrentTime();
        console.log('Player getCurrentTime returned:', playerTime);
        if (playerTime !== undefined && !isNaN(playerTime) && playerTime >= 0) {
          time = playerTime;
        } else {
          console.warn('Invalid time from player, using currentTime state:', currentTime);
          time = currentTime || 0;
        }
      } catch (err) {
        console.error('Error getting current time from player:', err);
        console.log('Falling back to currentTime state:', currentTime);
        time = currentTime || 0;
      }
    } else {
      console.warn('Player not available, using currentTime state:', currentTime);
      time = currentTime || 0;
    }
    
    // Auto-pause video if in fullscreen
    if (isFullscreen && currentPlayer) {
      try {
        currentPlayer.pauseVideo();
      } catch (err) {
        console.error('Error pausing video:', err);
      }
    }
    
    console.log('Setting timestamp to:', time);
    setSelectedTimestamp(time);
    console.log('Setting isCreateNoteModalOpen to true');
    setIsCreateNoteModalOpen(true);
    console.log('Modal state updated, isCreateNoteModalOpen should be true');
  };

  const handlePointClick = (timestamp: number) => {
    if (player) {
      handleManualSeek(timestamp);
      player.seekTo(timestamp, true);
      player.playVideo();
    }
  };

  const handleNoteClick = (note: Note) => {
    if (player) {
      handleManualSeek(note.timestamp);
      player.seekTo(note.timestamp, true);
      player.playVideo();
    }
    setSelectedNote(note);
    setIsNoteDetailModalOpen(true);
  };

  const handleNoteClickFromTimestamp = (timestamp: number) => {
    const note = session?.notes.find((n) => n.timestamp === timestamp);
    if (note) {
      handleNoteClick(note);
    } else if (player) {
      // If note not found, just seek to timestamp
      handleManualSeek(timestamp);
      player.seekTo(timestamp, true);
      player.playVideo();
    }
  };

  // Double-tap skip functionality for mobile
  const handleVideoDoubleTap = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!player || !videoContainerRef.current) return;

    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;

    const container = videoContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const tapX = x / width;

    const now = Date.now();
    const lastTap = lastTapRef.current;

    // Check if this is a double tap (within 300ms and similar position)
    if (
      lastTap &&
      now - lastTap.time < 300 &&
      Math.abs(tapX - lastTap.x) < 0.1
    ) {
      // Clear any pending timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }

      // Determine direction based on tap position
      const direction = tapX < 0.33 ? 'back' : tapX > 0.67 ? 'forward' : null;

      if (direction) {
        const currentTime = player.getCurrentTime();
        const newTime = direction === 'back' 
          ? Math.max(0, currentTime - 10) 
          : Math.min(videoDuration, currentTime + 10);

        player.seekTo(newTime, true);
        handleManualSeek(newTime);

        // Show visual feedback
        setSkipFeedback({ show: true, direction });
        setTimeout(() => {
          setSkipFeedback(null);
        }, 600);
      }

      // Reset last tap
      lastTapRef.current = null;
    } else {
      // Store this tap
      lastTapRef.current = { time: now, x: tapX, y: touch.clientY - rect.top };

      // Clear any existing timeout
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }

      // Reset after 300ms if no second tap
      doubleTapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = null;
      }, 300);
    }
  };

  // Handle fullscreen toggle - use pseudo-fullscreen (fixed positioning) instead of Fullscreen API
  // This allows us to overlay buttons on top of the video and reuse the existing player
  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Handle escape key to exit fullscreen and prevent scrolling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      // Save scroll position and prevent body scroll when in fullscreen
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Restore scroll position
        const scrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    } else {
      // Clean up when exiting fullscreen
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isFullscreen]);

  const handlePointCreated = (point: Point) => {
    // Socket event will be emitted by the server after API call
    // Just update local state optimistically
    setSession((prev) => {
      if (!prev) return prev;
      // Check if point already exists to avoid duplicates
      if (prev.points.some((p) => p.id === point.id)) {
        return prev;
      }
      return {
        ...prev,
        points: [...prev.points, point].sort(
          (a, b) => a.timestamp - b.timestamp
        ),
      };
    });
  };

  const handlePointUpdated = (point: Point) => {
    // Socket event will be emitted by the server after API call
    // Just update local state optimistically
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        points: prev.points
          .map((p) => (p.id === point.id ? point : p))
          .sort((a, b) => a.timestamp - b.timestamp),
      };
    });
  };

  const handlePointDeleted = (pointId: string) => {
    // Socket event will be emitted by the server after API call
    // Just update local state optimistically
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        points: prev.points.filter((p) => p.id !== pointId),
      };
    });
  };

  const handleNoteCreated = (note: Note) => {
    // Socket event will be emitted by the server after API call
    // Just update local state optimistically
    setSession((prev) => {
      if (!prev) return prev;
      // Check if note already exists to avoid duplicates
      if (prev.notes.some((n) => n.id === note.id)) {
        return prev;
      }
      return {
        ...prev,
        notes: [...prev.notes, note].sort(
          (a, b) => a.timestamp - b.timestamp
        ),
      };
    });
  };

  const handleNoteUpdated = (note: Note) => {
    // Socket event will be emitted by the server after API call
    // Just update local state optimistically
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        notes: prev.notes
          .map((n) => (n.id === note.id ? note : n))
          .sort((a, b) => a.timestamp - b.timestamp),
      };
    });
  };

  const handleNoteDeleted = (noteId: string) => {
    // Socket event will be emitted by the server after API call
    // Just update local state optimistically
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        notes: prev.notes.filter((n) => n.id !== noteId),
      };
    });
  };

  // Handle video click to toggle play/pause in fullscreen mode
  // This is needed because after modal closes, YouTube iframe might not receive clicks properly
  const handleVideoContainerClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // Only handle clicks in fullscreen mode
    if (!isFullscreen) return;
    
    const currentPlayer = player || playerRef.current;
    if (!currentPlayer) return;
    
    // Don't handle clicks on buttons or other interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    
    // Prevent event from reaching the iframe
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle play/pause when clicking on the video wrapper area
    try {
      const playerState = currentPlayer.getPlayerState();
      // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
      if (playerState === 1) {
        // Playing - pause it
        currentPlayer.pauseVideo();
      } else if (playerState === 2 || playerState === -1 || playerState === 5) {
        // Paused, unstarted, or cued - play it
        currentPlayer.playVideo();
      }
    } catch (err) {
      console.error('Error toggling video playback:', err);
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
      <div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-500">
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
      fs: 0, // Disable YouTube's native fullscreen button
      controls: 1, // Show controls but disable fullscreen
      playsinline: 1, // Enable inline playback on iOS
      modestbranding: 1,
    },
  };

  return (
    <>
      <div>
      {/* Reconnection indicator */}
      {isReconnecting && (
        <div className="mb-4 p-3 bg-accent-bg border border-accent-border rounded-md flex items-center gap-2">
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
          <span className="text-sm text-accent-secondary">
            Reconnecting... (Attempt {reconnectAttempts + 1})
          </span>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: session.teamAColor }}
            aria-label={`${teamAName} color`}
          />
          <h2 className="text-xl md:text-2xl font-bold text-text-primary">
            {teamAName} vs {teamBName}
          </h2>
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: session.teamBColor }}
            aria-label={`${teamBName} color`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-text-secondary">
            Created by {session.creator.username}
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSyncEnabled}
              onChange={(e) => setIsSyncEnabled(e.target.checked)}
              className="w-4 h-4 text-accent-primary border-border rounded focus:ring-accent-primary bg-bg-primary"
              aria-label="Enable playback synchronization"
            />
            <span className="text-sm text-text-secondary">Sync playback</span>
          </label>
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={async () => {
              const shareUrl = `${window.location.origin}/share/${session.shareToken}`;
              try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Share link copied to clipboard!');
              } catch (err) {
                // Fallback for browsers that don't support clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                  document.execCommand('copy');
                  toast.success('Share link copied to clipboard!');
                } catch (fallbackErr) {
                  toast.error('Failed to copy link. Please copy manually.');
                }
                document.body.removeChild(textArea);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent-primary rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-colors"
            aria-label="Copy share link"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Fullscreen overlay - controls only, transparent background */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100000] pointer-events-none"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          {/* Exit fullscreen button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleFullscreen();
            }}
            className="absolute top-4 right-4 z-[100000] p-3 bg-black bg-opacity-75 text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-auto"
            aria-label="Exit fullscreen"
            title="Exit fullscreen (or press ESC)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {/* Floating action buttons */}
          {canMarkPoints && (
            <div 
              className="absolute right-4 z-[100000] flex flex-col gap-3 pointer-events-auto"
              style={{ 
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              {/* Team A button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMarkPoint('A');
                }}
                className={`w-[60px] h-[60px] rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center transition-all hover:opacity-90 active:scale-95`}
                style={{ 
                  backgroundColor: session.teamAColor
                }}
                aria-label={`${teamAName} scored`}
                title={`${teamAName} Scored`}
              >
                <span className="text-xl font-bold">A</span>
              </button>
              
              {/* Team B button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMarkPoint('B');
                }}
                className={`w-[60px] h-[60px] rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center transition-all hover:opacity-90 active:scale-95`}
                style={{ 
                  backgroundColor: session.teamBColor
                }}
                aria-label={`${teamBName} scored`}
                title={`${teamBName} Scored`}
              >
                <span className="text-xl font-bold">B</span>
              </button>
              
              {/* Add Note button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddNote();
                }}
                className="w-[60px] h-[60px] rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center transition-all active:scale-95"
                aria-label="Add Note"
                title="Add Note"
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          )}
          {/* Double-tap skip feedback */}
          {skipFeedback && (
            <div
              className="absolute inset-0 flex items-center justify-center z-[100001] pointer-events-none transition-opacity"
            >
              <div className="text-white text-4xl font-bold bg-black bg-opacity-50 px-6 py-3 rounded-lg">
                {skipFeedback.direction === 'back' ? '-10s' : '+10s'}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 ${isFullscreen ? 'pointer-events-none' : ''}`}>
        <div className="xl:col-span-2">
          {!isFullscreen && (
            <ScoreDisplay
              sessionId={sessionId}
              points={session.points.filter((point, index, self) => 
                index === self.findIndex((p) => p.id === point.id)
              )}
              teamAColor={session.teamAColor}
              teamBColor={session.teamBColor}
              teamAName={teamAName}
              teamBName={teamBName}
            />
          )}

          <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden mb-4">
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
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Video Error
                    </h3>
                    <p className="text-text-secondary mb-4 max-w-md">{videoError}</p>
                    <button
                      onClick={() => {
                        setVideoError(null);
                        setIsRetryingVideo(true);
                        // Force re-render by unmounting and remounting YouTube component
                        if (playerRef.current) {
                          try {
                            playerRef.current.loadVideoById(videoId);
                          } catch (err) {
                            console.error('Error reloading video:', err);
                          }
                        }
                        setTimeout(() => {
                          setIsRetryingVideo(false);
                        }, 1000);
                      }}
                      className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-colors"
                      aria-label="Retry loading video"
                    >
                      {isRetryingVideo ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  ref={videoContainerRef}
                  className="relative w-full bg-black"
                  style={{
                    ...(isFullscreen ? {
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100vw',
                      height: '100vh',
                      zIndex: 99999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: 'unset'
                    } : {
                      aspectRatio: '16/9'
                    })
                  }}
                  onTouchEnd={handleVideoDoubleTap}
                >
                  <div 
                    className="w-full h-full relative" 
                    style={isFullscreen ? { 
                      aspectRatio: '16/9', 
                      width: '100%', 
                      height: '100%', 
                      maxWidth: '100vw', 
                      maxHeight: '100vh'
                    } : {}}
                  >
                    <YouTube
                      videoId={videoId}
                      opts={opts}
                      onReady={handlePlayerReady}
                      onStateChange={handleStateChange}
                      onError={handlePlayerError}
                      className="w-full h-full"
                      iframeClassName="w-full h-full"
                    />
                    {/* Transparent overlay to capture clicks in fullscreen - covers entire video area */}
                    {isFullscreen && (
                      <div
                        className="absolute inset-0 cursor-pointer"
                        style={{
                          zIndex: 10,
                          pointerEvents: 'auto',
                          backgroundColor: 'transparent' // Explicitly transparent
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoContainerClick(e);
                        }}
                        onTouchEnd={(e) => {
                          // Handle double-tap skip functionality first
                          handleVideoDoubleTap(e);

                          // Also handle single tap for play/pause
                          e.stopPropagation();
                          if (e.touches.length === 0 || e.changedTouches.length > 0) {
                            handleVideoContainerClick(e as any);
                          }
                        }}
                      />
                    )}
                  </div>
                {/* Custom fullscreen button - only show when not in fullscreen */}
                {!isFullscreen && (
                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 md:p-3 bg-black bg-opacity-75 text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Enter fullscreen"
                    title="Enter fullscreen"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                )}
                {/* Floating action buttons for non-fullscreen */}
                {canMarkPoints && !isFullscreen && (
                  <div 
                    className="absolute right-2 md:right-4 z-10 flex flex-col gap-2 md:gap-3"
                    style={{ 
                      pointerEvents: 'auto',
                      bottom: '60px'
                    }}
                  >
                    {/* Team A button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkPoint('A');
                      }}
                      className={`w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center transition-all hover:opacity-90 active:scale-95`}
                      style={{ 
                        backgroundColor: session.teamAColor,
                        pointerEvents: 'auto'
                      }}
                      aria-label={`${teamAName} scored`}
                      title={`${teamAName} Scored`}
                    >
                      <span className="text-lg md:text-xl font-bold">A</span>
                    </button>
                    
                    {/* Team B button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkPoint('B');
                      }}
                      className={`w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center transition-all hover:opacity-90 active:scale-95`}
                      style={{ 
                        backgroundColor: session.teamBColor,
                        pointerEvents: 'auto'
                      }}
                      aria-label={`${teamBName} scored`}
                      title={`${teamBName} Scored`}
                    >
                      <span className="text-lg md:text-xl font-bold">B</span>
                    </button>
                    
                    {/* Add Note button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddNote();
                      }}
                      className="w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center transition-all active:scale-95"
                      aria-label="Add Note"
                      title="Add Note"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <svg
                        className="w-6 h-6 md:w-7 md:h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                {/* Double-tap skip feedback */}
                {skipFeedback && !isFullscreen && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity"
                  >
                    <div className="text-white text-4xl font-bold bg-black bg-opacity-50 px-6 py-3 rounded-lg">
                      {skipFeedback.direction === 'back' ? '-10s' : '+10s'}
                    </div>
                  </div>
                )}
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
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Invalid YouTube URL
                  </h3>
                  <p className="text-text-secondary">
                    The YouTube URL for this session is invalid or missing.
                  </p>
                </div>
              </div>
            )}
            {!isFullscreen && (
              <>
                <Timeline
                  points={session.points.filter((point, index, self) => 
                    index === self.findIndex((p) => p.id === point.id)
                  )}
                  notes={session.notes}
                  currentTime={currentTime}
                  videoDuration={videoDuration}
                  teamAColor={session.teamAColor}
                  teamBColor={session.teamBColor}
                  userId={userId}
                  onPointClick={handlePointClick}
                  onNoteClick={handleNoteClick}
                />
              </>
            )}
          </div>

          {!isFullscreen && (
            <>
              <PointsList
                points={session.points.filter((point, index, self) =>
                  index === self.findIndex((p) => p.id === point.id)
                )}
                teamA={session.teamA}
                teamB={session.teamB}
                teamACustomName={session.teamACustomName}
                teamBCustomName={session.teamBCustomName}
                teamAColor={session.teamAColor}
                teamBColor={session.teamBColor}
                userId={userId}
                isLeagueAdmin={isLeagueAdmin}
                onPointClick={handlePointClick}
                onPointUpdated={handlePointUpdated}
                onPointDeleted={handlePointDeleted}
              />
            </>
          )}
        </div>

          {!isFullscreen && (
            <div className="flex flex-col gap-4">
              <ActiveViewers sessionId={sessionId} currentUserId={userId} />
              <NotesPanel
                notes={session.notes}
                userId={userId}
                isLeagueAdmin={isLeagueAdmin}
                onNoteClick={handleNoteClickFromTimestamp}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
              />
            </div>
          )}
      </div>

      {session && (
        <>
          <CreatePointModal
            isOpen={isCreatePointModalOpen}
            onClose={() => {
              setIsCreatePointModalOpen(false);
              setSelectedTimestamp(null);
              setSelectedTeamIdentifier('A');
            }}
            sessionId={sessionId}
            timestamp={selectedTimestamp || 0}
            teamA={session.teamA}
            teamB={session.teamB}
            teamACustomName={session.teamACustomName}
            teamBCustomName={session.teamBCustomName}
            teamAColor={session.teamAColor}
            teamBColor={session.teamBColor}
            initialTeamIdentifier={selectedTeamIdentifier}
            onSuccess={handlePointCreated}
          />

          <CreateNoteModal
            isOpen={isCreateNoteModalOpen}
            onClose={() => {
              console.log('Closing CreateNoteModal');
              setIsCreateNoteModalOpen(false);
              setSelectedTimestamp(null);
            }}
            sessionId={sessionId}
            timestamp={selectedTimestamp || 0}
            onSuccess={handleNoteCreated}
          />

          {selectedNote && (
            <NoteDetailModal
              isOpen={isNoteDetailModalOpen}
              onClose={() => {
                setIsNoteDetailModalOpen(false);
                setSelectedNote(null);
              }}
              note={selectedNote}
              userId={userId}
              onEdit={(note) => {
                // Find the note in session and open edit modal
                const fullNote = session.notes.find((n) => n.id === note.id);
                if (fullNote) {
                  // This will be handled by NotesPanel's EditNoteModal
                  setIsNoteDetailModalOpen(false);
                  setSelectedNote(null);
                }
              }}
              onDelete={(noteId) => {
                handleNoteDeleted(noteId);
                setIsNoteDetailModalOpen(false);
                setSelectedNote(null);
              }}
            />
          )}
        </>
      )}

      
    </div>
    </>
  );
};

