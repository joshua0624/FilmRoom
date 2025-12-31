'use client';

import { useLeague } from '@/contexts/LeagueContext';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export const LeagueSelector = () => {
  const { activeLeague, leagues, setActiveLeague, isLoading } = useLeague();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-text-secondary">
        Loading leagues...
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-text-secondary">
        No leagues found
      </div>
    );
  }

  if (leagues.length === 1) {
    return (
      <div className="px-3 py-2 text-sm font-medium text-text-primary">
        {leagues[0].name}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-md hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{activeLeague?.name || 'Select League'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-bg-primary border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => {
                setActiveLeague(league);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-bg-secondary transition-colors ${
                activeLeague?.id === league.id
                  ? 'bg-accent-bg text-accent-secondary font-medium'
                  : 'text-text-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{league.name}</span>
                {!league.isPublic && (
                  <span className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-tertiary rounded">
                    Private
                  </span>
                )}
              </div>
              {league._count && (
                <div className="text-xs text-text-tertiary mt-1">
                  {league._count.teams} teams · {league._count.sessions} sessions
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
