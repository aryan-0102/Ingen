export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ensureMockUser } from '@/lib/seed-user';

export async function GET(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const [classCount, fileCount, chatCount, stats] = await Promise.all([
      db.classMember.count({ where: { userId } }),
      db.libraryFile.count({ where: { uploadedById: userId } }),
      db.chatSession.count({ where: { userId } }),
      db.userStats.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({
      activeClasses: classCount,
      libraryFiles: fileCount,
      studyStreak: stats?.studyStreak || 0,
      aiChats: chatCount,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
