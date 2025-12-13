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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let {
      youtubeUrl,
      teamAId,
      teamBId,
      teamACustomName,
      teamBCustomName,
      teamAColor,
      teamBColor,
    } = body;

    if (!youtubeUrl || !teamAColor || !teamBColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sanitize custom team names if provided
    if (teamACustomName && typeof teamACustomName === 'string') {
      teamACustomName = teamACustomName.trim().replace(/<[^>]*>/g, '');
      if (teamACustomName.length === 0 || teamACustomName.length > 50) {
        return NextResponse.json(
          { error: 'Team A custom name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
    }

    if (teamBCustomName && typeof teamBCustomName === 'string') {
      teamBCustomName = teamBCustomName.trim().replace(/<[^>]*>/g, '');
      if (teamBCustomName.length === 0 || teamBCustomName.length > 50) {
        return NextResponse.json(
          { error: 'Team B custom name must be between 1 and 50 characters' },
          { status: 400 }
        );
      }
    }

    // Validate color format
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(teamAColor) || !hexColorRegex.test(teamBColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Colors must be hex format (e.g., #3B82F6)' },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Validate team IDs if provided
    if (teamAId) {
      const teamA = await prisma.team.findUnique({
        where: { id: teamAId },
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      });

      if (!teamA || teamA.members.length === 0) {
        return NextResponse.json(
          { error: 'Team A not found or you are not a member' },
          { status: 404 }
        );
      }
    }

    if (teamBId) {
      const teamB = await prisma.team.findUnique({
        where: { id: teamBId },
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      });

      if (!teamB || teamB.members.length === 0) {
        return NextResponse.json(
          { error: 'Team B not found or you are not a member' },
          { status: 404 }
        );
      }
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString('hex');

    const filmSession = await prisma.filmSession.create({
      data: {
        youtubeUrl,
        teamAId: teamAId || null,
        teamBId: teamBId || null,
        teamACustomName: teamACustomName || null,
        teamBCustomName: teamBCustomName || null,
        teamAColor,
        teamBColor,
        creatorId: session.user.id,
        shareToken,
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
      },
    });

    return NextResponse.json(filmSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}


