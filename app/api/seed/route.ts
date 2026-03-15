import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if already seeded (user has classes)
    const { count } = await supabase
      .from('class_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    if (count && count > 0) {
      return NextResponse.json({ message: 'Already seeded', seeded: false })
    }

    // Create 3 demo classes
    const classesData = [
      {
        name: 'Calculus II',
        subject: 'Mathematics',
        code: 'MATH02',
        description: 'Advanced integration techniques and series',
        color: '#6366f1',
        creator_id: user_id,
      },
      {
        name: 'Physics 101',
        subject: 'Physics',
        code: 'PHYS01',
        description: 'Classical mechanics and thermodynamics',
        color: '#f59e0b',
        creator_id: user_id,
      },
      {
        name: 'Intro to CS',
        subject: 'Computer Science',
        code: 'COMP01',
        description: 'Algorithms, data structures, and programming',
        color: '#10b981',
        creator_id: user_id,
      },
    ]

    const { data: classes, error: classError } = await supabase
      .from('classes')
      .insert(classesData)
      .select()

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 })
    }

    // Add user as owner of each class
    const memberships = (classes || []).map((c) => ({
      class_id: c.id,
      user_id,
      role: 'owner' as const,
    }))

    await supabase.from('class_members').insert(memberships)

    // Create 5 demo library files
    const filesData = [
      {
        user_id,
        class_id: classes?.[0]?.id,
        file_name: 'Integration_Techniques.pdf',
        file_type: 'application/pdf',
        file_size: 2456000,
        storage_path: `${user_id}/demo_integration.pdf`,
        tags: ['calculus', 'integration'],
      },
      {
        user_id,
        class_id: classes?.[0]?.id,
        file_name: 'Series_Convergence_Notes.pdf',
        file_type: 'application/pdf',
        file_size: 1823000,
        storage_path: `${user_id}/demo_series.pdf`,
        tags: ['calculus', 'series'],
      },
      {
        user_id,
        class_id: classes?.[1]?.id,
        file_name: 'Newton_Laws_Summary.pdf',
        file_type: 'application/pdf',
        file_size: 984000,
        storage_path: `${user_id}/demo_newton.pdf`,
        tags: ['physics', 'mechanics'],
      },
      {
        user_id,
        class_id: classes?.[1]?.id,
        file_name: 'Thermodynamics_Formulas.png',
        file_type: 'image/png',
        file_size: 567000,
        storage_path: `${user_id}/demo_thermo.png`,
        tags: ['physics', 'thermodynamics'],
      },
      {
        user_id,
        class_id: classes?.[2]?.id,
        file_name: 'Sorting_Algorithms.md',
        file_type: 'text/markdown',
        file_size: 34000,
        storage_path: `${user_id}/demo_sorting.md`,
        tags: ['cs', 'algorithms'],
      },
    ]

    await supabase.from('library_files').insert(filesData)

    // Create 5 demo calendar events
    const eventsData = [
      {
        user_id,
        title: 'Calculus II Lecture',
        event_type: 'class' as const,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:30',
        subject: 'Mathematics',
        color: '#6366f1',
      },
      {
        user_id,
        title: 'Physics Lab',
        event_type: 'class' as const,
        day_of_week: 2,
        start_time: '14:00',
        end_time: '16:00',
        subject: 'Physics',
        color: '#f59e0b',
      },
      {
        user_id,
        title: 'CS Lecture',
        event_type: 'class' as const,
        day_of_week: 3,
        start_time: '11:00',
        end_time: '12:30',
        subject: 'Computer Science',
        color: '#10b981',
      },
      {
        user_id,
        title: 'Study: Integration Practice',
        event_type: 'study' as const,
        day_of_week: 4,
        start_time: '16:00',
        end_time: '18:00',
        subject: 'Mathematics',
        color: '#8b5cf6',
      },
      {
        user_id,
        title: 'Algorithm Review',
        event_type: 'study' as const,
        day_of_week: 5,
        start_time: '10:00',
        end_time: '11:30',
        subject: 'Computer Science',
        color: '#06b6d4',
      },
    ]

    await supabase.from('calendar_events').insert(eventsData)

    // Create 1 demo AI chat with 2 messages
    const { data: chat } = await supabase
      .from('ai_chats')
      .insert({
        user_id,
        title: 'Help with Chain Rule',
      })
      .select()
      .single()

    if (chat) {
      await supabase.from('ai_messages').insert([
        {
          chat_id: chat.id,
          role: 'user',
          content: 'Can you explain the chain rule in calculus?',
        },
        {
          chat_id: chat.id,
          role: 'assistant',
          content:
            'The **chain rule** is used to differentiate composite functions. If you have f(g(x)), the derivative is:\n\n**f\'(g(x)) · g\'(x)**\n\nThink of it as the "outer derivative times the inner derivative."\n\n**Example:** Find d/dx [sin(x²)]\n- Outer function: sin(u), derivative: cos(u)\n- Inner function: x², derivative: 2x\n- Result: cos(x²) · 2x = **2x·cos(x²)**',
        },
      ])
    }

    // Create study streak
    await supabase.from('study_streaks').insert({
      user_id,
      current_streak: 5,
      longest_streak: 12,
      last_study_date: new Date().toISOString().split('T')[0],
    })

    // Create 2 demo exams
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)

    await supabase.from('exams').insert([
      {
        user_id,
        subject: 'Mathematics',
        exam_date: nextWeek.toISOString().split('T')[0],
      },
      {
        user_id,
        subject: 'Physics',
        exam_date: nextMonth.toISOString().split('T')[0],
      },
    ])

    return NextResponse.json({
      message: 'Demo data seeded successfully',
      seeded: true,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
