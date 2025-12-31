'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface League {
  id: string;
  name: string;
  creatorId: string;
  isPublic: boolean;
  createdAt: string;
  creator: {
    id: string;
    username: string;
  };
  _count?: {
    teams: number;
    sessions: number;
  };
}

interface LeagueContextType {
  activeLeague: League | null;
  setActiveLeague: (league: League | null) => void;
  leagues: League[];
  setLeagues: (leagues: League[]) => void;
  isLoading: boolean;
  refreshLeagues: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

const STORAGE_KEY = 'filmroom_active_league';

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [activeLeague, setActiveLeagueState] = useState<League | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load active league from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActiveLeagueState(parsed);
      } catch (error) {
        console.error('Failed to parse stored league:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Fetch user's leagues
  const refreshLeagues = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leagues');

      // If unauthorized, silently return (user not logged in)
      if (response.status === 401) {
        setLeagues([]);
        setActiveLeague(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch leagues');
      }

      const data = await response.json();
      setLeagues(data);

      // If no active league is set but we have leagues, set the first one
      if (!activeLeague && data.length > 0) {
        setActiveLeague(data[0]);
      }

      // If active league is set but not in the list, clear it
      if (activeLeague && !data.find((l: League) => l.id === activeLeague.id)) {
        setActiveLeague(null);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setLeagues([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leagues when session is available
  useEffect(() => {
    if (status === 'authenticated') {
      refreshLeagues();
    }
  }, [status]);

  // Update localStorage when active league changes
  const setActiveLeague = (league: League | null) => {
    setActiveLeagueState(league);
    if (league) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(league));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <LeagueContext.Provider
      value={{
        activeLeague,
        setActiveLeague,
        leagues,
        setLeagues,
        isLoading,
        refreshLeagues,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}
