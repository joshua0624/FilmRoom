'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings, ChevronLeft } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { LeagueSelector } from '@/components/leagues/LeagueSelector';

interface NavigationProps {
  showBackButton?: boolean;
  backHref?: string;
}

export const Navigation = ({ showBackButton = false, backHref }: NavigationProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const navLinks = [
    { href: '/leagues', label: 'Leagues' },
    { href: '/teams', label: 'Teams' },
    { href: '/sessions', label: 'Sessions' },
    { href: '/stats', label: 'Stats' },
  ];

  const isActive = (href: string) => {
    if (href === '/leagues' && pathname?.startsWith('/leagues')) return true;
    if (href === '/teams' && pathname?.startsWith('/teams')) return true;
    if (href === '/sessions' && pathname?.startsWith('/sessions')) return true;
    if (href === '/stats' && pathname?.startsWith('/stats')) return true;
    return pathname === href;
  };

  return (
    <nav className="bg-bg-secondary border-b border-border sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-6">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            )}
            
            <Link
              href="/teams"
              className="text-2xl font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
            >
              FilmRoom
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <LeagueSelector />

            <button
              className="text-text-secondary hover:text-text-primary transition-colors p-2"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="text-sm text-text-secondary">
              {session?.user?.name || session?.user?.email || 'User'}
            </div>

            <SignOutButton />
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="md:hidden mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};


