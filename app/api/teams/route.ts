import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        players: true,
        _count: {
          select: {
            members: true,
            players: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = createTeamSchema.parse(body);

    const team = await prisma.team.create({
      data: {
        name,
        color,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            isAdmin: true,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        players: true,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

