import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emitToSession } from '@/lib/socket';
import { isLeagueAdmin } from '@/lib/leagueHelpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timestamp, title, content, visibility } = body;

    // Check if note exists and user is the creator
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        session: true,
      },
    });

    if (!note || note.sessionId !== id) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Check if user can edit this note
    // Users can edit if they are:
    // 1. A league admin (or league creator)
    // 2. The user who created the note
    const isAdmin = await isLeagueAdmin(session.user.id, note.session.leagueId);
    const isNoteCreator = note.createdByUserId === session.user.id;

    if (!isAdmin && !isNoteCreator) {
      return NextResponse.json(
        { error: 'You can only edit notes you created, unless you are a league admin' },
        { status: 403 }
      );
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(timestamp !== undefined && { timestamp: parseFloat(timestamp) }),
        ...(title && { title }),
        ...(content && { content }),
        ...(visibility && { visibility }),
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
    emitToSession(id, 'note-updated', updatedNote);

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if note exists and user is the creator
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        session: true,
      },
    });

    if (!note || note.sessionId !== id) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Check if user can delete this note
    // Users can delete if they are:
    // 1. A league admin (or league creator)
    // 2. The user who created the note
    const isAdmin = await isLeagueAdmin(session.user.id, note.session.leagueId);
    const isNoteCreator = note.createdByUserId === session.user.id;

    if (!isAdmin && !isNoteCreator) {
      return NextResponse.json(
        { error: 'You can only delete notes you created, unless you are a league admin' },
        { status: 403 }
      );
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    // Emit socket event for real-time sync
    emitToSession(id, 'note-deleted', noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}


