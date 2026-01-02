import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isLeagueCreator } from '@/lib/leagueHelpers';

/**
 * GET /api/leagues/[id]/admins
 * Get all admins for a league
 */
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

    const league = await prisma.league.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Get all league admins
    const admins = await prisma.leagueMember.findMany({
      where: {
        leagueId: id,
        isAdmin: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        addedAt: 'asc',
      },
    });

    return NextResponse.json({
      admins: admins.map((admin) => ({
        userId: admin.user.id,
        username: admin.user.username,
        addedAt: admin.addedAt,
      })),
      creatorId: league.creatorId,
    });
  } catch (error) {
    console.error('Error fetching league admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league admins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues/[id]/admins
 * Add a user as a league admin
 * Only the league creator can add admins
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Only league creator can add admins
    const isCreator = await isLeagueCreator(session.user.id, id);
    if (!isCreator) {
      return NextResponse.json(
        { error: 'Only the league creator can add admins' },
        { status: 403 }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add or update the league member as admin
    const leagueMember = await prisma.leagueMember.upsert({
      where: {
        leagueId_userId: {
          leagueId: id,
          userId,
        },
      },
      create: {
        leagueId: id,
        userId,
        isAdmin: true,
      },
      update: {
        isAdmin: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      userId: leagueMember.user.id,
      username: leagueMember.user.username,
      addedAt: leagueMember.addedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding league admin:', error);
    return NextResponse.json(
      { error: 'Failed to add league admin' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leagues/[id]/admins
 * Remove a user as a league admin
 * Only the league creator can remove admins
 */
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Only league creator can remove admins
    const isCreator = await isLeagueCreator(session.user.id, id);
    if (!isCreator) {
      return NextResponse.json(
        { error: 'Only the league creator can remove admins' },
        { status: 403 }
      );
    }

    // Prevent removing self as admin if they're the creator
    const league = await prisma.league.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (league?.creatorId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove the league creator as admin' },
        { status: 400 }
      );
    }

    // Remove admin status or delete the league member entirely
    await prisma.leagueMember.delete({
      where: {
        leagueId_userId: {
          leagueId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing league admin:', error);
    return NextResponse.json(
      { error: 'Failed to remove league admin' },
      { status: 500 }
    );
  }
}
