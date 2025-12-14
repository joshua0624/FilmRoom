import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.filmSession.findMany({
      where: {
        creatorId: session.user.id,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}