import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';
import { checkAndTransferPermission } from '@/lib/activeViewers';

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

    // Check if permission needs to be transferred (if current point-marker is inactive)
    const permissionTransferred = await checkAndTransferPermission(id);

    if (permissionTransferred) {
      // Emit event to notify all viewers of permission change
      emitToSession(id, 'point-permission-changed', {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to update heartbeat' },
      { status: 500 }
    );
  }
}




