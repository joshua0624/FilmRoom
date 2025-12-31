import { prisma } from '@/lib/prisma';

/**
 * Check if a user is a member of any team in a league
 * @param userId - The user's ID
 * @param leagueId - The league's ID
 * @returns True if the user is a member of at least one team in the league
 */
export async function isLeagueMember(
  userId: string,
  leagueId: string
): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: {
      leagueId,
      members: {
        some: {
          userId,
        },
      },
    },
  });

  return !!team;
}

/**
 * Get all team IDs that a user is a member of within a specific league
 * @param userId - The user's ID
 * @param leagueId - The league's ID
 * @returns Array of team IDs
 */
export async function getUserTeamsInLeague(
  userId: string,
  leagueId: string
): Promise<string[]> {
  const teams = await prisma.team.findMany({
    where: {
      leagueId,
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return teams.map((t) => t.id);
}

/**
 * Check if a user is the creator of a league
 * @param userId - The user's ID
 * @param leagueId - The league's ID
 * @returns True if the user created the league
 */
export async function isLeagueCreator(
  userId: string,
  leagueId: string
): Promise<boolean> {
  const league = await prisma.league.findFirst({
    where: {
      id: leagueId,
      creatorId: userId,
    },
  });

  return !!league;
}

/**
 * Get all leagues that a user is a member of (via team membership)
 * @param userId - The user's ID
 * @returns Array of league objects
 */
export async function getUserLeagues(userId: string) {
  const leagues = await prisma.league.findMany({
    where: {
      teams: {
        some: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      _count: {
        select: {
          teams: true,
          sessions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return leagues;
}

/**
 * Verify a league password
 * @param leagueId - The league's ID
 * @param password - The password to verify
 * @returns True if the password matches or league is public
 */
export async function verifyLeaguePassword(
  leagueId: string,
  password: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: {
      isPublic: true,
      passwordHash: true,
    },
  });

  if (!league) {
    return false;
  }

  // Public leagues don't require password
  if (league.isPublic) {
    return true;
  }

  // Private leagues require correct password
  if (!league.passwordHash) {
    return false;
  }

  return await bcrypt.compare(password, league.passwordHash);
}
