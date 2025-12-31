import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/leagues - List all leagues user is a member of
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leagues = await prisma.league.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId: session.user.id,
                  },
                },
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
        _count: {
          select: {
            teams: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(leagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  }
}

// POST /api/leagues - Create a new league
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, isPublic, password } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'League name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'League name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Validate password for private leagues
    if (!isPublic && (!password || password.length < 4)) {
      return NextResponse.json(
        { error: 'Private leagues require a password (minimum 4 characters)' },
        { status: 400 }
      );
    }

    // Hash password if private league
    let passwordHash = null;
    if (!isPublic && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const league = await prisma.league.create({
      data: {
        name: name.trim(),
        creatorId: session.user.id,
        isPublic: isPublic !== false, // Default to true if not specified
        passwordHash,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            teams: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error('Error creating league:', error);
    return NextResponse.json(
      { error: 'Failed to create league' },
      { status: 500 }
    );
  }
}
