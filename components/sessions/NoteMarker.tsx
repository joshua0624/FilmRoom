'use client';

interface NoteMarkerProps {
  note: {
    id: string;
    timestamp: number;
  };
  currentTime: number;
  videoDuration: number;
  onClick: () => void;
}

export const NoteMarker = ({
  note,
  currentTime,
  videoDuration,
  onClick,
}: NoteMarkerProps) => {
  const isActive = Math.abs(currentTime - note.timestamp) < 2;
  const position = videoDuration > 0 ? (note.timestamp / videoDuration) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="absolute top-0 w-3 h-3 rounded-full border-2 border-bg-secondary transition-transform duration-200 cursor-pointer hover:scale-125"
      style={{
        backgroundColor: '#eab308',
        marginTop: '-2px',
        transform: 'translateX(-50%)',
      }}
      aria-label={`Note at ${Math.floor(note.timestamp / 60)}:${Math.floor(note.timestamp % 60).toString().padStart(2, '0')}`}
      title={`Note at ${Math.floor(note.timestamp / 60)}:${Math.floor(note.timestamp % 60).toString().padStart(2, '0')}`}
    />
  );
};

