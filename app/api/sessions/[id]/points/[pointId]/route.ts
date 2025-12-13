import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  try {
    const { id, pointId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      timestamp,
      teamId,
      teamIdentifier,
      scorerName,
      assisterName,
      notes,
    } = body;

    // Check if point exists and user has access
    const point = await prisma.point.findUnique({
      where: { id: pointId },
      include: {
        session: true,
      },
    });

    if (!point || point.sessionId !== id) {
      return NextResponse.json(
        { error: 'Point not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the session
    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      include: {
        teamA: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        teamB: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
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

    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (filmSession.teamA?.members && filmSession.teamA.members.length > 0) ||
      (filmSession.teamB?.members && filmSession.teamB.members.length > 0);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedPoint = await prisma.point.update({
      where: { id: pointId },
      data: {
        ...(timestamp !== undefined && { timestamp: parseFloat(timestamp) }),
        ...(teamId !== undefined && { teamId: teamId || null }),
        ...(teamIdentifier && { teamIdentifier }),
        ...(scorerName !== undefined && { scorerName: scorerName || null }),
        ...(assisterName !== undefined && {
          assisterName: assisterName || null,
        }),
        ...(notes !== undefined && { notes: notes || null }),
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
    emitToSession(id, 'point-updated', updatedPoint);

    return NextResponse.json(updatedPoint);
  } catch (error) {
    console.error('Error updating point:', error);
    return NextResponse.json(
      { error: 'Failed to update point' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  try {
    const { id, pointId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if point exists and user has access
    const point = await prisma.point.findUnique({
      where: { id: pointId },
      include: {
        session: true,
      },
    });

    if (!point || point.sessionId !== id) {
      return NextResponse.json(
        { error: 'Point not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the session
    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      include: {
        teamA: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        teamB: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
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

    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (filmSession.teamA?.members && filmSession.teamA.members.length > 0) ||
      (filmSession.teamB?.members && filmSession.teamB.members.length > 0);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.point.delete({
      where: { id: pointId },
    });

    // Emit socket event for real-time sync
    emitToSession(id, 'point-deleted', pointId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting point:', error);
    return NextResponse.json(
      { error: 'Failed to delete point' },
      { status: 500 }
    );
  }
}


