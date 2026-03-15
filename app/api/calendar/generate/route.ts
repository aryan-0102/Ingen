import { createServiceClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, study_hours, preferred_times, subjects, exams } =
      await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Build prompt for Gemini
    const examInfo = exams && exams.length > 0
      ? `Upcoming exams: ${exams.map((e: { subject: string; exam_date: string }) => `${e.subject} on ${e.exam_date}`).join(', ')}.`
      : 'No upcoming exams.'

    const prompt = `Generate a weekly study timetable as a JSON array. The student has ${study_hours || 4} hours per day to study. Preferred study times: ${(preferred_times || ['morning', 'evening']).join(', ')}. Subjects to cover: ${(subjects || ['General Study']).join(', ')}. ${examInfo}

Create 5-8 study blocks spread across the week (Monday=1 through Friday=5). Each block should be 1-2 hours. Prioritize subjects with upcoming exams.

Return ONLY a JSON array with objects having these exact fields:
- title (string): descriptive study session name
- event_type (string): always "ai_block"
- day_of_week (number): 1-5 for Mon-Fri
- start_time (string): HH:MM format (24h)
- end_time (string): HH:MM format (24h)
- subject (string): the subject name
- color (string): hex color code (use #8B5CF6 for purple/AI blocks)

Example: [{"title": "Math Review", "event_type": "ai_block", "day_of_week": 1, "start_time": "16:00", "end_time": "17:30", "subject": "Math", "color": "#8B5CF6"}]`

    const events = await generateJSON(prompt)

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Failed to generate study plan. Please try again.' },
        { status: 500 }
      )
    }

    // Delete existing AI-generated blocks for this user
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user_id)
      .eq('event_type', 'ai_block')

    // Insert new events
    const eventsToInsert = events.map((e: Record<string, unknown>) => ({
      user_id,
      title: e.title,
      event_type: 'ai_block' as const,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
      subject: e.subject || null,
      color: e.color || '#8B5CF6',
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('calendar_events')
      .insert(eventsToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ events: inserted || [] })
  } catch (error) {
    console.error('Calendar generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
