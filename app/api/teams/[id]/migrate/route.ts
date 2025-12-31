import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const migrateTeamSchema = z.object({
  targetLeagueId: z.string().min(1, 'Target league ID is required'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { targetLeagueId } = migrateTeamSchema.parse(body);

    // Fetch the team
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        league: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify target league exists
    const targetLeague = await prisma.league.findUnique({
      where: { id: targetLeagueId },
    });

    if (!targetLeague) {
      return NextResponse.json(
        { error: 'Target league not found' },
        { status: 404 }
      );
    }

    // Only allow if user is:
    // 1. Team creator
    // 2. Current league creator
    // 3. Target league creator
    const isTeamCreator = team.creatorId === session.user.id;
    const isCurrentLeagueCreator = team.league.creatorId === session.user.id;
    const isTargetLeagueCreator = targetLeague.creatorId === session.user.id;

    if (!isTeamCreator && !isCurrentLeagueCreator && !isTargetLeagueCreator) {
      return NextResponse.json(
        { error: 'You must be the team creator or league creator to migrate teams' },
        { status: 403 }
      );
    }

    // Update team's league
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        leagueId: targetLeagueId,
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

    return NextResponse.json(updatedTeam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error migrating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
