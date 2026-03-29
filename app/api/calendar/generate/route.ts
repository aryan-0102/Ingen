import { generateJSON } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ensureMockUser } from '@/lib/seed-user';

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id;

    const { study_hours, study_hours_per_day, preferred_times, subjects, exams } =
      await request.json();

    const hours = study_hours || study_hours_per_day || 4;

    const examInfo =
      exams && exams.length > 0
        ? `Upcoming exams: ${exams.map((e: { subject: string; exam_date: string }) => `${e.subject} on ${e.exam_date}`).join(', ')}.`
        : 'No upcoming exams.';

    const prompt = `Generate a weekly study timetable as a JSON array. The student has ${hours} hours per day to study. Preferred study times: ${(preferred_times || ['morning', 'evening']).join(', ')}. Subjects to cover: ${(subjects || ['General Study']).join(', ')}. ${examInfo}

Create 5-8 study blocks spread across the week (Monday=1 through Friday=5). Each block should be 1-2 hours. Prioritize subjects with upcoming exams.

Return ONLY a JSON array with objects having these exact fields:
- title (string): descriptive study session name
- event_type (string): always "ai_block"
- day_of_week (number): 1-5 for Mon-Fri
- start_time (string): HH:MM format (24h)
- end_time (string): HH:MM format (24h)
- subject (string): the subject name
- color (string): hex color code (use #8B5CF6 for purple/AI blocks)

Example: [{"title": "Math Review", "event_type": "ai_block", "day_of_week": 1, "start_time": "16:00", "end_time": "17:30", "subject": "Math", "color": "#8B5CF6"}]`;

    const events = await generateJSON(prompt);

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Failed to generate study plan. Please try again.' },
        { status: 500 }
      );
    }

    // Delete existing AI-generated blocks for this user
    await db.calendarEvent.deleteMany({
      where: { userId, eventType: 'ai_block' },
    });

    // Insert new events
    const created = await Promise.all(
      events.map((e: Record<string, unknown>) =>
        db.calendarEvent.create({
          data: {
            userId,
            title: String(e.title || 'Study Block'),
            eventType: 'ai_block',
            dayOfWeek: Number(e.day_of_week),
            startTime: String(e.start_time),
            endTime: String(e.end_time),
            subject: e.subject ? String(e.subject) : null,
            color: e.color ? String(e.color) : '#8B5CF6',
          },
        })
      )
    );

    return NextResponse.json({
      events: created.map((ev) => ({
        id: ev.id,
        user_id: ev.userId,
        title: ev.title,
        event_type: ev.eventType,
        day_of_week: ev.dayOfWeek,
        start_time: ev.startTime,
        end_time: ev.endTime,
        subject: ev.subject,
        color: ev.color,
        created_at: ev.createdAt,
      })),
    });
  } catch (error) {
    console.error('Calendar generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
