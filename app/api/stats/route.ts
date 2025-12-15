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
    const minPointsPerGame = searchParams.get('minPointsPerGame');
    const maxPointsPerGame = searchParams.get('maxPointsPerGame');
    const minAssistsPerGame = searchParams.get('minAssistsPerGame');
    const maxAssistsPerGame = searchParams.get('maxAssistsPerGame');
    const viewMode = searchParams.get('viewMode') || 'cumulative';
    const singleGameCategory = searchParams.get('singleGameCategory') || 'points';

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

    console.log(`[Stats API] Found ${points.length} points from ${sessionIds.length} sessions`);
    console.log(`[Stats API] Sample points:`, points.slice(0, 5));

    // Get all players grouped by team to validate player names
    const allPlayers = await prisma.player.findMany({
      select: {
        id: true,
        teamId: true,
        name: true,
      },
    });

    console.log(`[Stats API] Found ${allPlayers.length} total players`);
    console.log(`[Stats API] Sample players:`, allPlayers.slice(0, 5));

    // Create a case-insensitive map of all player names (normalized to lowercase)
    // This allows us to match points regardless of case differences
    const normalizedPlayerNames = new Set<string>();
    const nameToOriginalName = new Map<string, string>(); // lowercase -> original case
    
    allPlayers.forEach((player) => {
      const normalizedName = player.name.trim().toLowerCase();
      normalizedPlayerNames.add(normalizedName);
      // Store the original name for the first occurrence (or we could use the most common one)
      if (!nameToOriginalName.has(normalizedName)) {
        nameToOriginalName.set(normalizedName, player.name.trim());
      }
    });

    console.log(`[Stats API] Normalized player names count: ${normalizedPlayerNames.size}`);
    console.log(`[Stats API] Sample normalized names:`, Array.from(normalizedPlayerNames).slice(0, 10));

    // Helper function to normalize and check if a name matches a player
    const normalizeName = (name: string | null): string | null => {
      if (!name) return null;
      return name.trim().toLowerCase();
    };

    const getOriginalName = (normalizedName: string): string => {
      return nameToOriginalName.get(normalizedName) || normalizedName;
    };

    // Aggregate stats
    const statsMap = new Map<
      string,
      { goals: number; assists: number; gamesPlayed: Set<string> }
    >();

    let unmatchedScorers: string[] = [];
    let matchedScorers: string[] = [];

    // Count goals
    points.forEach((point) => {
      if (!point.scorerName) return;

      const normalizedScorerName = normalizeName(point.scorerName);
      if (!normalizedScorerName) return;

      // Check if player name exists in ANY team's roster (case-insensitive)
      // The requirement is to count ALL players who have points in sessions with preset rosters
      const isValidPlayer = normalizedPlayerNames.has(normalizedScorerName);

      if (isValidPlayer) {
        // Use the original name from the database for consistency
        const originalName = getOriginalName(normalizedScorerName);
        
        if (!statsMap.has(originalName)) {
          statsMap.set(originalName, {
            goals: 0,
            assists: 0,
            gamesPlayed: new Set(),
          });
        }
        const stats = statsMap.get(originalName)!;
        stats.goals += 1;
        stats.gamesPlayed.add(point.sessionId);
        matchedScorers.push(point.scorerName);
      } else {
        unmatchedScorers.push(point.scorerName);
      }
    });

    console.log(`[Stats API] Matched ${matchedScorers.length} scorer names`);
    console.log(`[Stats API] Unmatched scorer names:`, [...new Set(unmatchedScorers)].slice(0, 10));

    let unmatchedAssisters: string[] = [];
    let matchedAssisters: string[] = [];

    // Count assists (excluding "Unassisted")
    points.forEach((point) => {
      if (
        !point.assisterName ||
        point.assisterName === 'Unassisted'
      ) {
        return;
      }

      const normalizedAssisterName = normalizeName(point.assisterName);
      if (!normalizedAssisterName) return;

      // Check if player name exists in ANY team's roster (case-insensitive)
      const isValidPlayer = normalizedPlayerNames.has(normalizedAssisterName);

      if (isValidPlayer) {
        // Use the original name from the database for consistency
        const originalName = getOriginalName(normalizedAssisterName);
        
        if (!statsMap.has(originalName)) {
          statsMap.set(originalName, {
            goals: 0,
            assists: 0,
            gamesPlayed: new Set(),
          });
        }
        const stats = statsMap.get(originalName)!;
        stats.assists += 1;
        stats.gamesPlayed.add(point.sessionId);
        matchedAssisters.push(point.assisterName);
      } else {
        unmatchedAssisters.push(point.assisterName);
      }
    });

    console.log(`[Stats API] Matched ${matchedAssisters.length} assister names`);
    console.log(`[Stats API] Unmatched assister names:`, [...new Set(unmatchedAssisters)].slice(0, 10));
    console.log(`[Stats API] Total unique players in stats: ${statsMap.size}`);

    // Handle single game leaders mode
    if (viewMode === 'singleGame') {
      // Create a map to track per-session stats for each player
      const singleGameStatsMap = new Map<
        string,
        Map<string, { goals: number; assists: number }>
      >(); // playerName -> sessionId -> stats

      // Process points to get per-session stats
      points.forEach((point) => {
        // Process scorer
        if (point.scorerName) {
          const normalizedScorerName = normalizeName(point.scorerName);
          if (normalizedScorerName && normalizedPlayerNames.has(normalizedScorerName)) {
            const originalName = getOriginalName(normalizedScorerName);
            if (!singleGameStatsMap.has(originalName)) {
              singleGameStatsMap.set(originalName, new Map());
            }
            const playerSessions = singleGameStatsMap.get(originalName)!;
            if (!playerSessions.has(point.sessionId)) {
              playerSessions.set(point.sessionId, { goals: 0, assists: 0 });
            }
            playerSessions.get(point.sessionId)!.goals += 1;
          }
        }

        // Process assister
        if (point.assisterName && point.assisterName !== 'Unassisted') {
          const normalizedAssisterName = normalizeName(point.assisterName);
          if (normalizedAssisterName && normalizedPlayerNames.has(normalizedAssisterName)) {
            const originalName = getOriginalName(normalizedAssisterName);
            if (!singleGameStatsMap.has(originalName)) {
              singleGameStatsMap.set(originalName, new Map());
            }
            const playerSessions = singleGameStatsMap.get(originalName)!;
            if (!playerSessions.has(point.sessionId)) {
              playerSessions.set(point.sessionId, { goals: 0, assists: 0 });
            }
            playerSessions.get(point.sessionId)!.assists += 1;
          }
        }
      });

      // Find the best single game for each player based on category
      const singleGameLeaders: Array<{
        playerName: string;
        singleGameValue: number;
        goals: number;
        assists: number;
        sessionId: string;
      }> = [];

      singleGameStatsMap.forEach((sessions, playerName) => {
        type BestSession = {
          sessionId: string;
          goals: number;
          assists: number;
          value: number;
        };
        
        let bestSession: BestSession | null = null;

        sessions.forEach((stats, sessionId) => {
          let value = 0;
          if (singleGameCategory === 'points') {
            value = stats.goals;
          } else if (singleGameCategory === 'assists') {
            value = stats.assists;
          } else if (singleGameCategory === 'combined') {
            value = stats.goals + stats.assists;
          }

          if (!bestSession || value > bestSession.value) {
            bestSession = {
              sessionId,
              goals: stats.goals,
              assists: stats.assists,
              value,
            };
          }
        });

        if (bestSession !== null) {
          const session: BestSession = bestSession;
          if (session.value > 0) {
            singleGameLeaders.push({
              playerName,
              singleGameValue: session.value,
              goals: session.goals,
              assists: session.assists,
              sessionId: session.sessionId,
            });
          }
        }
      });

      // Sort by single game value
      singleGameLeaders.sort((a, b) => b.singleGameValue - a.singleGameValue);

      console.log(`[Stats API] Returning ${singleGameLeaders.length} single game leaders`);
      return NextResponse.json(singleGameLeaders);
    }

    // Convert to array and format (cumulative mode)
    let stats = Array.from(statsMap.entries())
      .map(([playerName, data]) => {
        const gamesPlayed = data.gamesPlayed.size;
        const pointsPerGame = gamesPlayed > 0 ? data.goals / gamesPlayed : 0;
        const assistsPerGame = gamesPlayed > 0 ? data.assists / gamesPlayed : 0;
        return {
          playerName,
          goals: data.goals,
          assists: data.assists,
          gamesPlayed,
          pointsPerGame,
          assistsPerGame,
        };
      });

    // Filter by per-game averages
    if (minPointsPerGame) {
      const min = parseFloat(minPointsPerGame);
      if (!isNaN(min)) {
        stats = stats.filter((s) => s.pointsPerGame >= min);
      }
    }
    if (maxPointsPerGame) {
      const max = parseFloat(maxPointsPerGame);
      if (!isNaN(max)) {
        stats = stats.filter((s) => s.pointsPerGame <= max);
      }
    }
    if (minAssistsPerGame) {
      const min = parseFloat(minAssistsPerGame);
      if (!isNaN(min)) {
        stats = stats.filter((s) => s.assistsPerGame >= min);
      }
    }
    if (maxAssistsPerGame) {
      const max = parseFloat(maxAssistsPerGame);
      if (!isNaN(max)) {
        stats = stats.filter((s) => s.assistsPerGame <= max);
      }
    }

    // Sort
    stats.sort((a, b) => {
      if (sortBy === 'assists') {
        return b.assists - a.assists || b.goals - a.goals;
      }
      return b.goals - a.goals || b.assists - a.assists;
    });

    console.log(`[Stats API] Returning ${stats.length} player stats`);
    console.log(`[Stats API] Top 5 stats:`, stats.slice(0, 5));

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

