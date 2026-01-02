import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isLeagueAdmin } from '@/lib/leagueHelpers';

/**
 * GET /api/leagues/[id]/check-admin
 * Check if the current user is a league admin
 */
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

    const isAdmin = await isLeagueAdmin(session.user.id, id);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
