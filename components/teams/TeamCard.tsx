'use client';

import { useRouter } from 'next/navigation';
import { Settings, Users, Target } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface TeamCardProps {
  id: string;
  name: string;
  color: string;
  creator: {
    id: string;
    username: string;
  };
  memberCount: number;
  playerCount: number;
  isAdmin?: boolean;
}

export const TeamCard = ({
  id,
  name,
  color,
  memberCount,
  playerCount,
  isAdmin = false,
}: TeamCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/teams/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-bg-secondary border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#3d3d3d] hover:-translate-y-0.5"
      role="button"
      tabIndex={0}
      aria-label={`View team: ${name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Color bar at top */}
      <div
        className="h-2"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-semibold text-text-primary mb-2">
            {name}
          </h3>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {playerCount} players
            </span>
          </div>

          {/* Admin badge */}
          {isAdmin && (
            <span className="inline-block px-2 py-1 bg-accent-bg text-accent-secondary border border-accent-border rounded text-xs font-medium">
              Admin
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="tertiary"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            icon={Settings}
            className="flex-1"
          >
            Manage Team
          </Button>
        </div>
      </div>
    </div>
  );
};


