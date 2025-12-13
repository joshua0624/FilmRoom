import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';
import { updateActiveViewerPermission } from '@/lib/activeViewers';

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

    // Clean up inactive viewers (inactive for more than 60 seconds)
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    await prisma.activeViewer.deleteMany({
      where: {
        sessionId: id,
        lastActive: {
          lt: sixtySecondsAgo,
        },
      },
    });

    // Get all active viewers (active within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const activeViewers = await prisma.activeViewer.findMany({
      where: {
        sessionId: id,
        lastActive: {
          gte: thirtySecondsAgo,
        },
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

    // Upsert active viewer (don't set canMarkPoints here - it will be calculated below)
    const activeViewer = await prisma.activeViewer.upsert({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.user.id,
        },
      },
      update: {
        lastActive: new Date(),
      },
      create: {
        sessionId: id,
        userId: session.user.id,
        lastActive: new Date(),
        canMarkPoints: false, // Will be recalculated below
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

    // Recalculate permissions to ensure only one eligible viewer can mark points
    await updateActiveViewerPermission(id);

    // Fetch updated viewer to get correct canMarkPoints value
    const updatedViewer = await prisma.activeViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.user.id,
        },
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
    if (updatedViewer) {
      emitToSession(id, 'viewer-joined', {
        viewer: {
          userId: updatedViewer.userId,
          username: updatedViewer.user.username,
          canMarkPoints: updatedViewer.canMarkPoints,
          joinedAt: updatedViewer.joinedAt,
        },
      });

      // If permissions changed, notify all viewers
      if (updatedViewer.canMarkPoints !== activeViewer.canMarkPoints) {
        emitToSession(id, 'point-permission-changed', {});
      }

      return NextResponse.json(updatedViewer);
    }

    return NextResponse.json(activeViewer);

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

    // Update lastActive timestamp
    const activeViewer = await prisma.activeViewer.updateMany({
      where: {
        sessionId: id,
        userId: session.user.id,
      },
      data: {
        lastActive: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating viewer activity:', error);
    return NextResponse.json(
      { error: 'Failed to update viewer activity' },
      { status: 500 }
    );
  }
}

