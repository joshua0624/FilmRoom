const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting data migration to league system...\n');

  try {
    // Count existing data
    const teamCount = await prisma.team.count();
    const sessionCount = await prisma.filmSession.count();
    const noteCount = await prisma.note.count();
    const privateNoteCount = await prisma.note.count({ where: { isPrivate: true } });

    console.log('=== Current Data ===');
    console.log(`Teams: ${teamCount}`);
    console.log(`Sessions: ${sessionCount}`);
    console.log(`Notes: ${noteCount} (${privateNoteCount} private)\n`);

    // 1. Create default league
    console.log('[Step 1/4] Creating default league...');
    const firstUser = await prisma.user.findFirst();

    if (!firstUser) {
      throw new Error('No users found! Cannot create default league.');
    }

    const defaultLeague = await prisma.league.create({
      data: {
        name: "Default League",
        creatorId: firstUser.id,
        passwordHash: null,
        isPublic: true,
      }
    });

    console.log(`✓ Created league: ${defaultLeague.id} (${defaultLeague.name})\n`);

    // 2. Assign all teams to default league
    console.log('[Step 2/4] Migrating teams to default league...');
    const teamsUpdated = await prisma.team.updateMany({
      where: { leagueId: null },
      data: { leagueId: defaultLeague.id }
    });
    console.log(`✓ Updated ${teamsUpdated.count} teams\n`);

    // 3. Assign all sessions to default league
    console.log('[Step 3/4] Migrating sessions to default league...');
    const sessionsUpdated = await prisma.filmSession.updateMany({
      where: { leagueId: null },
      data: { leagueId: defaultLeague.id }
    });
    console.log(`✓ Updated ${sessionsUpdated.count} sessions\n`);

    // 4. Migrate note privacy to visibility
    console.log('[Step 4/4] Migrating note visibility...');
    const teamOnlyNotes = await prisma.note.updateMany({
      where: {
        isPrivate: true,
        visibility: null
      },
      data: { visibility: 'TEAM_ONLY' }
    });
    console.log(`✓ Migrated ${teamOnlyNotes.count} private notes → TEAM_ONLY`);

    const publicNotes = await prisma.note.updateMany({
      where: {
        isPrivate: false,
        visibility: null
      },
      data: { visibility: 'PUBLIC' }
    });
    console.log(`✓ Migrated ${publicNotes.count} public notes → PUBLIC\n`);

    // Verification
    console.log('=== VERIFICATION ===');
    const teamsWithoutLeague = await prisma.team.count({ where: { leagueId: null } });
    const sessionsWithoutLeague = await prisma.filmSession.count({ where: { leagueId: null } });
    const notesWithoutVisibility = await prisma.note.count({ where: { visibility: null } });

    console.log(`Teams without league: ${teamsWithoutLeague} (should be 0)`);
    console.log(`Sessions without league: ${sessionsWithoutLeague} (should be 0)`);
    console.log(`Notes without visibility: ${notesWithoutVisibility} (should be 0)\n`);

    const finalTeamCount = await prisma.team.count();
    const finalSessionCount = await prisma.filmSession.count();
    const finalNoteCount = await prisma.note.count();

    console.log('=== Final Counts ===');
    console.log(`Teams: ${finalTeamCount} (original: ${teamCount})`);
    console.log(`Sessions: ${finalSessionCount} (original: ${sessionCount})`);
    console.log(`Notes: ${finalNoteCount} (original: ${noteCount})\n`);

    if (finalTeamCount !== teamCount || finalSessionCount !== sessionCount || finalNoteCount !== noteCount) {
      throw new Error('❌ DATA LOSS DETECTED! Row counts do not match. DO NOT PROCEED TO STEP 3.');
    }

    if (teamsWithoutLeague > 0 || sessionsWithoutLeague > 0 || notesWithoutVisibility > 0) {
      throw new Error('❌ Incomplete migration! Some records were not updated. DO NOT PROCEED TO STEP 3.');
    }

    console.log('✅ Migration successful! No data loss detected.');
    console.log('✅ All data migrated to "Default League"');
    console.log('\nYou can now proceed to Step 3: Schema Finalization');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease restore from backup and investigate the error.');
    process.exit(1);
  }
}

migrate()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
