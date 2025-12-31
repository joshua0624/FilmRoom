import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { isLeagueMember } from '@/lib/leagueHelpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      include: {
        teamA: {
          select: {
            id: true,
            name: true,
            color: true,
            players: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teamB: {
          select: {
            id: true,
            name: true,
            color: true,
            players: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        points: {
          include: {
            markedBy: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
        notes: {
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user has access (creator or member of any team in the league)
    if (session?.user?.id) {
      const hasAccess =
        filmSession.creatorId === session.user.id ||
        await isLeagueMember(session.user.id, filmSession.leagueId);

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(filmSession);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

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

    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (filmSession.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.filmSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

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

    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Only creator can edit session
    if (filmSession.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { week } = body;

    // Validate week
    let validatedWeek: number | null = null;
    if (week !== null && week !== undefined && week !== '') {
      const weekNum = parseInt(week);
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 52) {
        return NextResponse.json(
          { error: 'Week must be a number between 1 and 52' },
          { status: 400 }
        );
      }
      validatedWeek = weekNum;
    }

    // Update session
    const updatedSession = await prisma.filmSession.update({
      where: { id },
      data: { week: validatedWeek },
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
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}





