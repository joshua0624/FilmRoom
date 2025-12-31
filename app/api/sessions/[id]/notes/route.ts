import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';
import { getUserTeamsInLeague, isLeagueMember } from '@/lib/leagueHelpers';

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
      select: {
        id: true,
        creatorId: true,
        leagueId: true,
      },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check league membership
    const hasAccess =
      filmSession.creatorId === session.user.id ||
      await isLeagueMember(session.user.id, filmSession.leagueId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user's teams in this league for team-only note filtering
    const userTeams = await getUserTeamsInLeague(session.user.id, filmSession.leagueId);

    const notes = await prisma.note.findMany({
      where: {
        sessionId: id,
        OR: [
          { visibility: 'PUBLIC' },
          {
            AND: [
              { visibility: 'TEAM_ONLY' },
              {
                createdBy: {
                  teamMemberships: {
                    some: {
                      teamId: { in: userTeams },
                    },
                  },
                },
              },
            ],
          },
          { createdByUserId: session.user.id }, // Always see own notes
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
    let { timestamp, title, content, visibility } = body;

    if (timestamp === undefined || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate visibility
    if (visibility && visibility !== 'PUBLIC' && visibility !== 'TEAM_ONLY') {
      return NextResponse.json(
        { error: 'Invalid visibility. Must be PUBLIC or TEAM_ONLY' },
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
      select: {
        id: true,
        creatorId: true,
        leagueId: true,
      },
    });

    if (!filmSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check league membership
    const hasAccess =
      filmSession.creatorId === session.user.id ||
      await isLeagueMember(session.user.id, filmSession.leagueId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const note = await prisma.note.create({
      data: {
        sessionId: id,
        timestamp: parseFloat(timestamp),
        title,
        content,
        visibility: visibility || 'PUBLIC', // Default to PUBLIC
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


