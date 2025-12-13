'use client';

interface PointMarkerProps {
  point: {
    id: string;
    timestamp: number;
    teamIdentifier: string;
  };
  currentTime: number;
  teamAColor: string;
  teamBColor: string;
  onClick: () => void;
}

export const PointMarker = ({
  point,
  currentTime,
  teamAColor,
  teamBColor,
  onClick,
}: PointMarkerProps) => {
  const isActive = Math.abs(currentTime - point.timestamp) < 2;
  const color = point.teamIdentifier === 'A' ? teamAColor : teamBColor;

  return (
    <button
      onClick={onClick}
      className="absolute top-0 w-3 h-3 rounded-full border-2 border-bg-secondary transition-transform duration-200 cursor-pointer hover:scale-125"
      style={{
        backgroundColor: color,
        marginTop: '-2px',
        transform: 'translateX(-50%)',
      }}
      aria-label={`Point at ${Math.floor(point.timestamp / 60)}:${Math.floor(point.timestamp % 60).toString().padStart(2, '0')}`}
      title={`Point at ${Math.floor(point.timestamp / 60)}:${Math.floor(point.timestamp % 60).toString().padStart(2, '0')}`}
    />
  );
};


