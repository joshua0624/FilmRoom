import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';

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

    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Clean up inactive viewers (inactive for more than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.activeViewer.deleteMany({
      where: {
        sessionId: id,
        lastActive: {
          lt: fiveMinutesAgo,
        },
      },
    });

    // Get all active viewers
    const activeViewers = await prisma.activeViewer.findMany({
      where: {
        sessionId: id,
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
        joinedAt: 'asc',
      },
    });

    return NextResponse.json(activeViewers);
  } catch (error) {
    console.error('Error fetching active viewers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active viewers' },
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

    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user has access
    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (filmSession.teamAId &&
        (await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: filmSession.teamAId,
              userId: session.user.id,
            },
          },
        }))) ||
      (filmSession.teamBId &&
        (await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: filmSession.teamBId,
              userId: session.user.id,
            },
          },
        })));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Upsert active viewer - all users can mark points
    const activeViewer = await prisma.activeViewer.upsert({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.user.id,
        },
      },
      update: {
        lastActive: new Date(),
        canMarkPoints: true, // All users can mark points
      },
      create: {
        sessionId: id,
        userId: session.user.id,
        lastActive: new Date(),
        canMarkPoints: true, // All users can mark points
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

    // Notify other viewers
    emitToSession(id, 'viewer-joined', {
      viewer: {
        userId: activeViewer.userId,
        username: activeViewer.user.username,
        canMarkPoints: activeViewer.canMarkPoints,
        joinedAt: activeViewer.joinedAt,
      },
    });

    return NextResponse.json(activeViewer);
  } catch (error) {
    console.error('Error joining session as viewer:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
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

    // Remove active viewer
    await prisma.activeViewer.deleteMany({
      where: {
        sessionId: id,
        userId: session.user.id,
      },
    });

    // Notify other viewers
    emitToSession(id, 'viewer-left', {
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving session:', error);
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
}


