import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';
import { isLeagueMember } from '@/lib/leagueHelpers';

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

    // Check if user has access to the session
    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        leagueId: true,
      },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (await isLeagueMember(session.user.id, filmSession.leagueId));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const points = await prisma.point.findMany({
      where: { sessionId: id },
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
    });

    return NextResponse.json(points);
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}

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
    let {
      timestamp,
      teamId,
      teamIdentifier,
      scorerName,
      assisterName,
      notes,
    } = body;

    if (
      timestamp === undefined ||
      !teamIdentifier ||
      (teamIdentifier !== 'A' && teamIdentifier !== 'B')
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sanitize optional text fields
    if (scorerName && typeof scorerName === 'string') {
      scorerName = scorerName.trim().replace(/<[^>]*>/g, '');
    }
    if (assisterName && typeof assisterName === 'string') {
      assisterName = assisterName.trim().replace(/<[^>]*>/g, '');
    }
    if (notes && typeof notes === 'string') {
      notes = notes.trim().replace(/<[^>]*>/g, '');
      if (notes.length > 5000) {
        return NextResponse.json(
          { error: 'Notes must be 5000 characters or less' },
          { status: 400 }
        );
      }
    }

    // Check if user has access to the session
    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        leagueId: true,
      },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (await isLeagueMember(session.user.id, filmSession.leagueId));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // All league members can mark points for any team
    const point = await prisma.point.create({
      data: {
        sessionId: id,
        timestamp: parseFloat(timestamp),
        teamId: teamId || null,
        teamIdentifier,
        scorerName: scorerName || null,
        assisterName: assisterName || null,
        notes: notes || null,
        markedByUserId: session.user.id,
      },
      include: {
        markedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Emit socket event for real-time sync
    emitToSession(id, 'point-created', point);

    return NextResponse.json(point, { status: 201 });
  } catch (error) {
    console.error('Error creating point:', error);
    return NextResponse.json(
      { error: 'Failed to create point' },
      { status: 500 }
    );
  }
}

