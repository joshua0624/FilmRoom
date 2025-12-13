import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate token format (should be 64 character hex string)
    if (!token || typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: 'Invalid share token format' },
        { status: 400 }
      );
    }

    const filmSession = await prisma.filmSession.findUnique({
      where: { shareToken: token },
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
          where: {
            isPrivate: false,
          },
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

    return NextResponse.json(filmSession);
  } catch (error) {
    console.error('Error fetching shared session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}


