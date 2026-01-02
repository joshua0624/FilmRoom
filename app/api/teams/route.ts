import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isLeagueMember } from '@/lib/leagueHelpers';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  leagueId: z.string().min(1, 'League ID is required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional league filter
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const isGuest = (session.user as any)?.isGuest || false;

    // If leagueId is provided and user is a guest
    if (leagueId && isGuest) {
      // Verify the league is public
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

      // Return all teams in the public league
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(teams);
    }

    // For regular users
    // If leagueId is provided, return all teams in the league
    // If no leagueId, return only teams the user is part of
    const teams = await prisma.team.findMany({
      where: leagueId
        ? {
            // Return all teams in the league
            leagueId,
          }
        : {
            // Return only user's teams if no league filter
            OR: [
              { creatorId: session.user.id },
              {
                members: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
            ],
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, leagueId } = createTeamSchema.parse(body);

    // Verify league exists and check if user is creator or member
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Allow if user is league creator OR already a member of the league
    const isCreator = league.creatorId === session.user.id;
    const isMember = await isLeagueMember(session.user.id, leagueId);

    if (!isCreator && !isMember) {
      return NextResponse.json(
        { error: 'You must be the league creator or a member to create a team' },
        { status: 403 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        color,
        leagueId,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            isAdmin: true,
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
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

