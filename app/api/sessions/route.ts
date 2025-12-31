import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { isLeagueMember } from '@/lib/leagueHelpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const isGuest = (session.user as any)?.isGuest || false;

    // If leagueId is provided (e.g., from guest mode or stats filtering)
    if (leagueId) {
      // For guest users, check if the league is public
      if (isGuest) {
        const league = await prisma.league.findUnique({
          where: { id: leagueId },
          select: { isPublic: true },
        });

        if (!league || !league.isPublic) {
          return NextResponse.json(
            { error: 'Guests can only access public leagues' },
            { status: 403 }
          );
        }
      } else {
        // For regular users, validate they are a member of the league
        const hasLeagueAccess = await isLeagueMember(session.user.id, leagueId);
        if (!hasLeagueAccess) {
          return NextResponse.json(
            { error: 'You do not have access to this league' },
            { status: 403 }
          );
        }
      }

      // Fetch sessions for the specific league
      const sessions = await prisma.filmSession.findMany({
        where: {
          leagueId,
        },
        include: {
          teamA: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          teamB: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
          _count: {
            select: {
              points: true,
              notes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(sessions);
    }

    // Default behavior: fetch sessions for leagues where user is a team member
    const sessions = await prisma.filmSession.findMany({
      where: {
        league: {
          teams: {
            some: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
      include: {
        teamA: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        teamB: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            points: true,
            notes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let {
      youtubeUrl,
      leagueId,
      teamAId,
      teamBId,
      teamACustomName,
      teamBCustomName,
      teamAColor,
      teamBColor,
      week,
    } = body;

    if (!youtubeUrl || !leagueId || !teamAColor || !teamBColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate user is member of the league
    const hasLeagueAccess = await isLeagueMember(session.user.id, leagueId);
    if (!hasLeagueAccess) {
      return NextResponse.json(
        { error: 'You must be a member of the league to create a session' },
        { status: 403 }
      );
    }

    // Sanitize custom team names if provided
    if (teamACustomName && typeof teamACustomName === 'string') {
      teamACustomName = teamACustomName.trim().replace(/<[^>]*>/g, '');
      if (teamACustomName.length === 0 || teamACustomName.length > 50) {
        return NextResponse.json(
          { error: 'Team A custom name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
    }

    if (teamBCustomName && typeof teamBCustomName === 'string') {
      teamBCustomName = teamBCustomName.trim().replace(/<[^>]*>/g, '');
      if (teamBCustomName.length === 0 || teamBCustomName.length > 50) {
        return NextResponse.json(
          { error: 'Team B custom name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
    }

    // Validate color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(teamAColor) || !hexColorRegex.test(teamBColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Colors must be hex format (e.g., #3B82F6)' },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Validate week if provided
    if (week !== null && week !== undefined) {
      const weekNum = parseInt(week);
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 52) {
        return NextResponse.json(
          { error: 'Week must be a number between 1 and 52' },
          { status: 400 }
        );
      }
      week = weekNum;
    } else {
      week = null;
    }

    // Validate team IDs if provided (must belong to the league)
    if (teamAId) {
      const teamA = await prisma.team.findUnique({
        where: { id: teamAId },
        select: {
          id: true,
          leagueId: true,
        },
      });

      if (!teamA) {
        return NextResponse.json(
          { error: 'Team A not found' },
          { status: 404 }
        );
      }

      if (teamA.leagueId !== leagueId) {
        return NextResponse.json(
          { error: 'Team A does not belong to the selected league' },
          { status: 400 }
        );
      }
    }

    if (teamBId) {
      const teamB = await prisma.team.findUnique({
        where: { id: teamBId },
        select: {
          id: true,
          leagueId: true,
        },
      });

      if (!teamB) {
        return NextResponse.json(
          { error: 'Team B not found' },
          { status: 404 }
        );
      }

      if (teamB.leagueId !== leagueId) {
        return NextResponse.json(
          { error: 'Team B does not belong to the selected league' },
          { status: 400 }
        );
      }
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString('hex');

    const filmSession = await prisma.filmSession.create({
      data: {
        youtubeUrl,
        leagueId,
        teamAId: teamAId || null,
        teamBId: teamBId || null,
        teamACustomName: teamACustomName || null,
        teamBCustomName: teamBCustomName || null,
        teamAColor,
        teamBColor,
        creatorId: session.user.id,
        shareToken,
        week,
      },
      include: {
        teamA: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        teamB: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(filmSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}


