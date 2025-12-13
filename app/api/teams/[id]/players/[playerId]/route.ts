import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await prisma.team.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                isAdmin: true,
              },
            },
          },
        ],
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = updatePlayerSchema.parse(body);

    const player = await prisma.player.update({
      where: {
        id: playerId,
        teamId: id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await prisma.team.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                isAdmin: true,
              },
            },
          },
        ],
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or unauthorized' }, { status: 404 });
    }

    await prisma.player.delete({
      where: {
        id: playerId,
        teamId: id,
      },
    });

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

