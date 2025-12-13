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

    // Check if user has access to the session
    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      include: {
        teamA: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        teamB: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
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

    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (filmSession.teamA?.members && filmSession.teamA.members.length > 0) ||
      (filmSession.teamB?.members && filmSession.teamB.members.length > 0);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const notes = await prisma.note.findMany({
      where: {
        sessionId: id,
        OR: [
          { isPrivate: false },
          { createdByUserId: session.user.id },
        ],
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
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
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

    const body = await request.json();
    let { timestamp, title, content, isPrivate } = body;

    if (timestamp === undefined || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 5000 characters' },
        { status: 400 }
      );
    }

    // Sanitize input (remove HTML tags, trim whitespace)
    title = title.trim().replace(/<[^>]*>/g, '');
    content = content.trim().replace(/<[^>]*>/g, '');

    // Check if user has access to the session
    const filmSession = await prisma.filmSession.findUnique({
      where: { id },
      include: {
        teamA: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        teamB: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
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

    const hasAccess =
      filmSession.creatorId === session.user.id ||
      (filmSession.teamA?.members && filmSession.teamA.members.length > 0) ||
      (filmSession.teamB?.members && filmSession.teamB.members.length > 0);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const note = await prisma.note.create({
      data: {
        sessionId: id,
        timestamp: parseFloat(timestamp),
        title,
        content,
        isPrivate: isPrivate || false,
        createdByUserId: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Emit socket event for real-time sync
    emitToSession(id, 'note-created', note);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}


