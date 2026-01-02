import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/search?username=<username>
 * Search for a user by exact username match
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    // Find user by exact username match (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error searching for user:', error);
    return NextResponse.json(
      { error: 'Failed to search for user' },
      { status: 500 }
    );
  }
}
