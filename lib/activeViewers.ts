import { prisma } from './prisma';

/**
 * Recalculate who can mark points based on active viewers
 * Only one viewer can mark points at a time (the earliest active viewer with permission)
 */
export const updateActiveViewerPermission = async (
  sessionId: string
): Promise<void> => {
  // Get the session to check eligibility
  const filmSession = await prisma.filmSession.findUnique({
    where: { id: sessionId },
    include: {
      teamA: {
        include: {
          members: true,
        },
      },
      teamB: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!filmSession) {
    return;
  }

  // Get all active viewers
  const activeViewers = await prisma.activeViewer.findMany({
    where: {
      sessionId,
    },
    orderBy: {
      joinedAt: 'asc',
    },
  });

  // Filter to only those who are eligible to mark points (creator or team member)
  const eligibleViewers = activeViewers.filter((viewer) => {
    // Check if user is creator
    if (filmSession.creatorId === viewer.userId) {
      return true;
    }
    // Check if user is a team member
    const isTeamAMember = filmSession.teamA?.members.some(
      (member) => member.userId === viewer.userId
    );
    const isTeamBMember = filmSession.teamB?.members.some(
      (member) => member.userId === viewer.userId
    );
    return isTeamAMember || isTeamBMember;
  });

  // Reset all permissions (but preserve eligibility in canMarkPoints for display purposes)
  // We'll set canMarkPoints to true only for the one who has permission
  await prisma.activeViewer.updateMany({
    where: {
      sessionId,
    },
    data: {
      canMarkPoints: false,
    },
  });

  // Grant permission to the earliest eligible viewer
  if (eligibleViewers.length > 0) {
    const pointMarker = eligibleViewers[0];
    await prisma.activeViewer.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId: pointMarker.userId,
        },
      },
      data: {
        canMarkPoints: true,
      },
    });
  }
};

/**
 * Get the user who currently has permission to mark points
 */
export const getPointMarker = async (
  sessionId: string
): Promise<{ userId: string; username: string } | null> => {
  const pointMarker = await prisma.activeViewer.findFirst({
    where: {
      sessionId,
      canMarkPoints: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!pointMarker) {
    return null;
  }

  return {
    userId: pointMarker.userId,
    username: pointMarker.user.username,
  };
};

/**
 * Check if current point-marker is inactive and transfer permission if needed
 * Returns true if permission was transferred
 */
export const checkAndTransferPermission = async (
  sessionId: string
): Promise<boolean> => {
  // Check if current point-marker is inactive (inactive for more than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const currentPointMarker = await prisma.activeViewer.findFirst({
    where: {
      sessionId,
      canMarkPoints: true,
    },
  });

  if (currentPointMarker) {
    const isInactive = currentPointMarker.lastActive < fiveMinutesAgo;

    if (isInactive) {
      // Transfer permission to next eligible viewer
      await updateActiveViewerPermission(sessionId);
      return true;
    }
  } else {
    // No current point-marker, assign to first eligible viewer
    await updateActiveViewerPermission(sessionId);
    return true;
  }

  return false;
};

