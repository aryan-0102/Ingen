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

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      avatar_url: user.avatarUrl,
      google_calendar_url: user.googleCalendarUrl,
      default_meet_link: user.defaultMeetLink,
      created_at: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const { full_name, avatar_url, role, google_calendar_url, default_meet_link } = await request.json();

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(full_name ? { fullName: full_name } : {}),
        ...(avatar_url ? { avatarUrl: avatar_url } : {}),
        ...(role ? { role } : {}),
        ...(google_calendar_url !== undefined ? { googleCalendarUrl: google_calendar_url } : {}),
        ...(default_meet_link !== undefined ? { defaultMeetLink: default_meet_link } : {}),
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      avatar_url: user.avatarUrl,
      google_calendar_url: user.googleCalendarUrl,
      default_meet_link: user.defaultMeetLink,
      updated_at: user.updatedAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
