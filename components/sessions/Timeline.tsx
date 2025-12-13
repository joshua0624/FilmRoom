'use client';

import { useMemo } from 'react';
import { PointMarker } from './PointMarker';
import { NoteMarker } from './NoteMarker';

interface Point {
  id: string;
  timestamp: number;
  teamIdentifier: string;
}

interface Note {
  id: string;
  timestamp: number;
  isPrivate?: boolean;
  createdBy?: {
    id: string;
  };
}

interface TimelineProps {
  points: Point[];
  notes: Note[];
  currentTime: number;
  videoDuration: number;
  teamAColor: string;
  teamBColor: string;
  userId?: string;
  onPointClick: (timestamp: number) => void;
  onNoteClick: (note: Note) => void;
}

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Timeline = ({
  points,
  notes,
  currentTime,
  videoDuration,
  teamAColor,
  teamBColor,
  userId,
  onPointClick,
  onNoteClick,
}: TimelineProps) => {
  // Calculate progress percentage
  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  // Filter private notes - only show if user is the creator
  const visibleNotes = notes.filter(
    (note) => !note.isPrivate || note.createdBy?.id === userId
  );

  // Combine and sort all markers by timestamp
  const allMarkers = useMemo(() => {
    const pointMarkers = points.map((point) => ({
      id: point.id,
      timestamp: point.timestamp,
      type: 'point' as const,
      data: point,
    }));

    const noteMarkers = visibleNotes.map((note) => ({
      id: note.id,
      timestamp: note.timestamp,
      type: 'note' as const,
      data: note,
    }));

    return [...pointMarkers, ...noteMarkers].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [points, visibleNotes]);

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Desktop Timeline - Overlay on progress bar */}
      <div className="hidden md:block relative w-full h-2 bg-bg-tertiary rounded-full">
        {/* Progress indicator */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: 'rgba(16, 185, 129, 0.3)',
          }}
          aria-label={`Video progress: ${formatTimestamp(currentTime)}`}
        />

        {/* Point markers */}
        {points.map((point) => {
          const position = videoDuration > 0 ? (point.timestamp / videoDuration) * 100 : 0;
          return (
            <div
              key={point.id}
              className="absolute"
              style={{
                left: `${Math.min(100, Math.max(0, position))}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <PointMarker
                point={point}
                currentTime={currentTime}
                teamAColor={teamAColor}
                teamBColor={teamBColor}
                onClick={() => onPointClick(point.timestamp)}
              />
            </div>
          );
        })}

        {/* Note markers */}
        {visibleNotes.map((note) => {
          const position = videoDuration > 0 ? (note.timestamp / videoDuration) * 100 : 0;
          return (
            <div
              key={note.id}
              className="absolute"
              style={{
                left: `${Math.min(100, Math.max(0, position))}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <NoteMarker
                note={note}
                currentTime={currentTime}
                videoDuration={videoDuration}
                onClick={() => onNoteClick(note)}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Timeline - Scrollable horizontal list */}
      <div className="md:hidden">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {allMarkers.map((marker) => (
              <div
                key={marker.id}
                className="flex flex-col items-center gap-1 min-w-[60px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (marker.type === 'point') {
                      onPointClick(marker.data.timestamp);
                    } else {
                      onNoteClick(marker.data);
                    }
                  }}
                  className="w-11 h-11 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-transform active:scale-95 hover:scale-125"
                  style={{
                    backgroundColor:
                      marker.type === 'point'
                        ? marker.data.teamIdentifier === 'A'
                          ? teamAColor
                          : teamBColor
                        : '#eab308',
                    minWidth: '44px',
                    minHeight: '44px',
                  }}
                  aria-label={`${marker.type === 'point' ? 'Point' : 'Note'} at ${formatTimestamp(marker.timestamp)}`}
                >
                  {marker.type === 'note' && (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </button>
                <span className="text-xs text-text-tertiary font-medium">
                  {formatTimestamp(marker.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

