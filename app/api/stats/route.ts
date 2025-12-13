import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const opponentTeamId = searchParams.get('opponentTeamId');
    const sortBy = searchParams.get('sortBy') || 'goals'; // 'goals' or 'assists'

    // Build date filter
    const dateFilter: any = {};
    if (startDate && startDate.trim() !== '') {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate && endDate.trim() !== '') {
      dateFilter.lte = new Date(endDate);
    }

    // Build session filter - include sessions with at least one preset roster
    // This ensures we're only counting stats from sessions with actual team rosters
    const baseFilter: any = {
      OR: [
        { teamAId: { not: null } },
        { teamBId: { not: null } },
      ],
    };

    // Build AND conditions array
    const andConditions: any[] = [baseFilter];

    // Add date filter if provided
    if (dateFilter.gte || dateFilter.lte) {
      andConditions.push({ createdAt: dateFilter });
    }

    // If opponent filter is specified, add it to the filter
    if (opponentTeamId && opponentTeamId.trim() !== '') {
      andConditions.push({
        OR: [
          { teamAId: opponentTeamId },
          { teamBId: opponentTeamId },
        ],
      });
    }

    const sessionFilter: any =
      andConditions.length === 1 ? baseFilter : { AND: andConditions };

    // Get all sessions matching the filter
    const sessions = await prisma.filmSession.findMany({
      where: sessionFilter,
      select: {
        id: true,
        teamAId: true,
        teamBId: true,
      },
    });

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all points from these sessions with their teamId
    const points = await prisma.point.findMany({
      where: {
        sessionId: { in: sessionIds },
        OR: [
          { scorerName: { not: null } },
          { assisterName: { not: null } },
        ],
      },
      select: {
        scorerName: true,
        assisterName: true,
        sessionId: true,
        teamId: true,
      },
    });

    // Get all players grouped by team to validate player names
    const allPlayers = await prisma.player.findMany({
      select: {
        id: true,
        teamId: true,
        name: true,
      },
    });

    // Create a map of teamId -> Set of player names for that team
    const teamPlayersMap = new Map<string, Set<string>>();
    allPlayers.forEach((player) => {
      if (!teamPlayersMap.has(player.teamId)) {
        teamPlayersMap.set(player.teamId, new Set());
      }
      teamPlayersMap.get(player.teamId)!.add(player.name);
    });

    // Also create a set of all player names for fallback (if teamId is null but name exists)
    const allPlayerNames = new Set(allPlayers.map((p) => p.name));

    // Aggregate stats
    const statsMap = new Map<
      string,
      { goals: number; assists: number; gamesPlayed: Set<string> }
    >();

    // Count goals
    points.forEach((point) => {
      if (!point.scorerName) return;

      // Check if player name exists in the team's roster, or in all players if teamId is null
      const isValidPlayer = point.teamId
        ? teamPlayersMap.get(point.teamId)?.has(point.scorerName)
        : allPlayerNames.has(point.scorerName);

      if (isValidPlayer) {
        if (!statsMap.has(point.scorerName)) {
          statsMap.set(point.scorerName, {
            goals: 0,
            assists: 0,
            gamesPlayed: new Set(),
          });
        }
        const stats = statsMap.get(point.scorerName)!;
        stats.goals += 1;
        stats.gamesPlayed.add(point.sessionId);
      }
    });

    // Count assists (excluding "Unassisted")
    points.forEach((point) => {
      if (
        !point.assisterName ||
        point.assisterName === 'Unassisted'
      ) {
        return;
      }

      // Check if player name exists in the team's roster, or in all players if teamId is null
      const isValidPlayer = point.teamId
        ? teamPlayersMap.get(point.teamId)?.has(point.assisterName)
        : allPlayerNames.has(point.assisterName);

      if (isValidPlayer) {
        if (!statsMap.has(point.assisterName)) {
          statsMap.set(point.assisterName, {
            goals: 0,
            assists: 0,
            gamesPlayed: new Set(),
          });
        }
        const stats = statsMap.get(point.assisterName)!;
        stats.assists += 1;
        stats.gamesPlayed.add(point.sessionId);
      }
    });

    // Convert to array and format
    const stats = Array.from(statsMap.entries())
      .map(([playerName, data]) => ({
        playerName,
        goals: data.goals,
        assists: data.assists,
        gamesPlayed: data.gamesPlayed.size,
      }))
      .sort((a, b) => {
        if (sortBy === 'assists') {
          return b.assists - a.assists || b.goals - a.goals;
        }
        return b.goals - a.goals || b.assists - a.assists;
      });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

