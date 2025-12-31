import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verifyLeaguePassword } from '@/lib/leagueHelpers';

// POST /api/leagues/[id]/join - Join a league by selecting/creating a team
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

    const body = await request.json();
    const { teamId, teamName, teamColor, password } = body;

    // Verify league exists
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        isPublic: true,
        passwordHash: true,
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Verify password for private leagues
    if (!league.isPublic) {
      const isValidPassword = await verifyLeaguePassword(leagueId, password || '');

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 403 }
        );
      }
    }

    // Option 1: Join existing team
    if (teamId) {
      // Verify team exists and belongs to this league
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          leagueId: true,
          members: {
            where: { userId: session.user.id },
          },
        },
      });

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      if (team.leagueId !== leagueId) {
        return NextResponse.json(
          { error: 'Team does not belong to this league' },
          { status: 400 }
        );
      }

      // Check if already a member
      if (team.members.length > 0) {
        return NextResponse.json(
          { error: 'You are already a member of this team' },
          { status: 400 }
        );
      }

      // Add user to team
      await prisma.teamMember.create({
        data: {
          teamId,
          userId: session.user.id,
          isAdmin: false,
        },
      });

      return NextResponse.json({ success: true, teamId });
    }

    // Option 2: Create new team
    if (teamName) {
      if (typeof teamName !== 'string' || teamName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Team name is required' },
          { status: 400 }
        );
      }

      if (teamName.trim().length > 50) {
        return NextResponse.json(
          { error: 'Team name must be 50 characters or less' },
          { status: 400 }
        );
      }

      const finalTeamColor = teamColor || '#3b82f6'; // Default blue

      const newTeam = await prisma.team.create({
        data: {
          name: teamName.trim(),
          color: finalTeamColor,
          creatorId: session.user.id,
          leagueId,
          members: {
            create: {
              userId: session.user.id,
              isAdmin: true, // Creator is admin of their team
            },
          },
        },
      });

      return NextResponse.json({ success: true, teamId: newTeam.id });
    }

    return NextResponse.json(
      { error: 'Either teamId or teamName must be provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error joining league:', error);
    return NextResponse.json(
      { error: 'Failed to join league' },
      { status: 500 }
    );
  }
}
