import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isLeagueMember } from '@/lib/leagueHelpers';

// GET /api/leagues/[id]/teams - Get all teams in a league
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify league exists (no membership check - needed for joining)
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true, isPublic: true },
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    const teams = await prisma.team.findMany({
      where: {
        leagueId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        players: true,
        _count: {
          select: {
            members: true,
            players: true,
            sessionsAsA: true,
            sessionsAsB: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/leagues/[id]/teams - Create a new team in the league
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the league
    const isMember = await isLeagueMember(session.user.id, leagueId);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this league.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: 'Team name must be 50 characters or less' },
        { status: 400 }
      );
    }

    const finalColor = color || '#3b82f6'; // Default blue

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        color: finalColor,
        creatorId: session.user.id,
        leagueId,
        members: {
          create: {
            userId: session.user.id,
            isAdmin: true, // Creator is admin
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        players: true,
        _count: {
          select: {
            members: true,
            players: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
