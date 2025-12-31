'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';

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

export default function GuestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not guest
    if (status === 'authenticated' && !(session?.user as any)?.isGuest) {
      router.push('/teams');
      return;
    }

    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Fetch public leagues
    if (status === 'authenticated') {
      fetchPublicLeagues();
    }
  }, [status, session, router]);

  const fetchPublicLeagues = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leagues/browse');

      if (!response.ok) {
        throw new Error('Failed to fetch leagues');
      }

      const data = await response.json();
      setLeagues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeagueSelect = (league: League) => {
    // Store the selected league in localStorage for the stats page
    localStorage.setItem('guest_league', JSON.stringify(league));
    router.push('/stats');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Guest Navigation */}
      <nav className="bg-bg-secondary border-b border-border sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-accent-primary">
              FilmRoom
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-text-secondary">
                Guest Mode
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] py-6 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome, Guest!
          </h1>
          <p className="text-text-secondary">
            Select a public league below to view player statistics. To access teams and sessions, please create an account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-500">
            {error}
          </div>
        )}

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-text-secondary">
                No public leagues available at the moment.
              </p>
            </div>
          ) : (
            leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => handleLeagueSelect(league)}
                className="bg-bg-secondary border border-border rounded-lg p-6 hover:border-accent-primary transition-all text-left group"
              >
                <h3 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
                  {league.name}
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Created by {league.creator.username}
                </p>
                <div className="flex items-center gap-4 text-sm text-text-tertiary">
                  <span>{league._count?.teams || 0} teams</span>
                  <span>•</span>
                  <span>{league._count?.sessions || 0} sessions</span>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
