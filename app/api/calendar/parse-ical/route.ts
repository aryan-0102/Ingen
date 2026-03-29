import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureMockUser } from '@/lib/seed-user';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Save the calendar URL to the user's profile via Prisma
    await db.user.update({
      where: { id: userId },
      data: { googleCalendarUrl: url },
    });

    return NextResponse.json({
      message: 'Calendar URL saved successfully',
      url,
    });
  } catch (error) {
    console.error('Parse iCal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
