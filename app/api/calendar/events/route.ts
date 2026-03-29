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

    const events = await db.calendarEvent.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const formatted = events.map((e) => ({
      id: e.id,
      user_id: e.userId,
      title: e.title,
      event_type: e.eventType,
      day_of_week: e.dayOfWeek,
      start_time: e.startTime,
      end_time: e.endTime,
      subject: e.subject,
      color: e.color,
      created_at: e.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Calendar events GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const { title, event_type, day_of_week, start_time, end_time, subject, color } =
      await request.json();

    if (!title || !event_type || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'title, event_type, day_of_week, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    const event = await db.calendarEvent.create({
      data: {
        userId,
        title,
        eventType: event_type,
        dayOfWeek: day_of_week,
        startTime: start_time,
        endTime: end_time,
        subject: subject || null,
        color: color || null,
      },
    });

    return NextResponse.json({
      event: {
        id: event.id,
        user_id: event.userId,
        title: event.title,
        event_type: event.eventType,
        day_of_week: event.dayOfWeek,
        start_time: event.startTime,
        end_time: event.endTime,
        subject: event.subject,
        color: event.color,
        created_at: event.createdAt,
      },
    });
  } catch (error) {
    console.error('Calendar events POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Calendar events DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
