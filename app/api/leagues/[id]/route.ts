import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isLeagueCreator, isLeagueMember } from '@/lib/leagueHelpers';
import bcrypt from 'bcryptjs';

// GET /api/leagues/[id] - Get league details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the league
    const isMember = await isLeagueMember(session.user.id, id);

    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this league.' },
        { status: 403 }
      );
    }

    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        teams: {
          include: {
            _count: {
              select: {
                members: true,
                players: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Don't send password hash to client
    const { passwordHash, ...leagueData } = league;

    return NextResponse.json(leagueData);
  } catch (error) {
    console.error('Error fetching league:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league' },
      { status: 500 }
    );
  }
}

// PATCH /api/leagues/[id] - Update league (creator only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only league creator can update
    const isCreator = await isLeagueCreator(session.user.id, id);

    if (!isCreator) {
      return NextResponse.json(
        { error: 'Only the league creator can update league settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, isPublic, password } = body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'League name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: 'League name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;

      // If switching to private and password provided, hash it
      if (!isPublic && password) {
        if (password.length < 4) {
          return NextResponse.json(
            { error: 'Password must be at least 4 characters' },
            { status: 400 }
          );
        }
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      // If switching to public, clear password
      if (isPublic) {
        updateData.passwordHash = null;
      }
    }

    // If just updating password (keeping private)
    if (password && isPublic === undefined) {
      const league = await prisma.league.findUnique({
        where: { id },
        select: { isPublic: true },
      });

      if (league && !league.isPublic) {
        if (password.length < 4) {
          return NextResponse.json(
            { error: 'Password must be at least 4 characters' },
            { status: 400 }
          );
        }
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
    }

    const updatedLeague = await prisma.league.update({
      where: { id },
      data: updateData,
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
    });

    // Don't send password hash to client
    const { passwordHash, ...leagueData } = updatedLeague;

    return NextResponse.json(leagueData);
  } catch (error) {
    console.error('Error updating league:', error);
    return NextResponse.json(
      { error: 'Failed to update league' },
      { status: 500 }
    );
  }
}

// DELETE /api/leagues/[id] - Delete league (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only league creator can delete
    const isCreator = await isLeagueCreator(session.user.id, id);

    if (!isCreator) {
      return NextResponse.json(
        { error: 'Only the league creator can delete the league' },
        { status: 403 }
      );
    }

    // Delete league (cascades to teams and sessions)
    await prisma.league.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting league:', error);
    return NextResponse.json(
      { error: 'Failed to delete league' },
      { status: 500 }
    );
  }
}
