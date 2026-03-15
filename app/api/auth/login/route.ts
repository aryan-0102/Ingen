import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'admin@g'
const ADMIN_PASSWORD = 'admin1'

async function seedDemoData(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  // Check if already seeded
  const { data: existing } = await supabase
    .from('class_members')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  // Create 3 classes
  const classes = [
    { name: 'Advanced Mathematics', subject: 'Math', code: 'MATH01', description: 'Calculus, Linear Algebra, and Statistics', color: '#0EA5E9', creator_id: userId, visibility: 'public' as const },
    { name: 'Physics Lab', subject: 'Physics', code: 'PHYS01', description: 'Mechanics, Thermodynamics, and Waves', color: '#10B981', creator_id: userId, visibility: 'public' as const },
    { name: 'Computer Science', subject: 'Computer Science', code: 'CS0101', description: 'Data Structures and Algorithms', color: '#8B5CF6', creator_id: userId, visibility: 'public' as const },
  ]

  const { data: createdClasses } = await supabase.from('classes').insert(classes).select()

  if (createdClasses) {
    // Add user as owner of each class
    const memberships = createdClasses.map((c) => ({
      class_id: c.id,
      user_id: userId,
      role: 'owner' as const,
    }))
    await supabase.from('class_members').insert(memberships)

    // Library files
    const files = [
      { user_id: userId, class_id: createdClasses[0].id, file_name: 'Calculus Notes.pdf', file_type: 'pdf', file_size: 2048576, storage_path: `${userId}/calculus_notes.pdf`, tags: ['math', 'calculus'] },
      { user_id: userId, class_id: createdClasses[0].id, file_name: 'Linear Algebra Cheat Sheet.pdf', file_type: 'pdf', file_size: 1024000, storage_path: `${userId}/linear_algebra.pdf`, tags: ['math', 'algebra'] },
      { user_id: userId, class_id: createdClasses[1].id, file_name: 'Physics Lab Manual.docx', file_type: 'docx', file_size: 3145728, storage_path: `${userId}/physics_lab.docx`, tags: ['physics', 'lab'] },
      { user_id: userId, class_id: createdClasses[2].id, file_name: 'Algorithm Complexity.txt', file_type: 'txt', file_size: 51200, storage_path: `${userId}/algo_complexity.txt`, tags: ['cs', 'algorithms'] },
      { user_id: userId, class_id: null, file_name: 'Study Schedule.pdf', file_type: 'pdf', file_size: 512000, storage_path: `${userId}/schedule.pdf`, tags: ['planning'] },
    ]
    await supabase.from('library_files').insert(files)
  }

  // Calendar events
  const events = [
    { user_id: userId, title: 'Mathematics Lecture', event_type: 'class' as const, day_of_week: 1, start_time: '09:00', end_time: '10:30', subject: 'Math', color: '#0EA5E9' },
    { user_id: userId, title: 'Physics Lab', event_type: 'class' as const, day_of_week: 2, start_time: '14:00', end_time: '16:00', subject: 'Physics', color: '#10B981' },
    { user_id: userId, title: 'CS Lecture', event_type: 'class' as const, day_of_week: 3, start_time: '11:00', end_time: '12:30', subject: 'Computer Science', color: '#8B5CF6' },
    { user_id: userId, title: 'Calculus Study Session', event_type: 'study' as const, day_of_week: 4, start_time: '16:00', end_time: '18:00', subject: 'Math', color: '#06B6D4' },
    { user_id: userId, title: 'Algorithm Practice', event_type: 'study' as const, day_of_week: 5, start_time: '10:00', end_time: '12:00', subject: 'Computer Science', color: '#8B5CF6' },
  ]
  await supabase.from('calendar_events').insert(events)

  // AI chat with sample messages
  const { data: chat } = await supabase
    .from('ai_chats')
    .insert({ user_id: userId, title: 'Help with Calculus' })
    .select()
    .single()

  if (chat) {
    await supabase.from('ai_messages').insert([
      { chat_id: chat.id, role: 'user', content: 'Can you explain the chain rule in calculus?' },
      { chat_id: chat.id, role: 'assistant', content: "The **chain rule** is used to differentiate composite functions. If you have a function f(g(x)), the derivative is:\n\n**f'(g(x)) · g'(x)**\n\nThink of it as peeling layers: differentiate the outer function, keep the inner function unchanged, then multiply by the derivative of the inner function.\n\n**Example:** If h(x) = (3x + 1)², then:\n- Outer: u² → derivative: 2u\n- Inner: 3x + 1 → derivative: 3\n- Result: 2(3x + 1) · 3 = **6(3x + 1)**" },
    ])
  }

  // Study streak
  await supabase.from('study_streaks').insert({
    user_id: userId,
    current_streak: 5,
    last_study_date: new Date().toISOString().split('T')[0],
    longest_streak: 12,
  })

  // Exams
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)

  await supabase.from('exams').insert([
    { user_id: userId, subject: 'Calculus Midterm', exam_date: nextWeek.toISOString().split('T')[0] },
    { user_id: userId, subject: 'Physics Final', exam_date: nextMonth.toISOString().split('T')[0] },
  ])
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Admin bypass
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Try signing in first
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        // User doesn't exist yet — auto-create
        const { data: createData, error: createError } =
          await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          })

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 400 })
        }

        // Create profile
        await supabase.from('profiles').insert({
          id: createData.user.id,
          full_name: 'Admin User',
          email,
          role: 'both',
          avatar_url: null,
          google_calendar_url: null,
          default_meet_link: null,
          study_hours_per_day: 4,
          preferred_times: ['morning', 'evening'],
          theme: 'light',
        })

        // Seed demo data
        await seedDemoData(supabase, createData.user.id)

        // Now sign in
        const { data: newSignIn, error: newSignInError } =
          await supabase.auth.signInWithPassword({ email, password })

        if (newSignInError) {
          return NextResponse.json({ error: newSignInError.message }, { status: 400 })
        }

        return NextResponse.json({
          user: newSignIn.user,
          session: newSignIn.session,
        })
      }

      // Sign in succeeded — seed if needed
      await seedDemoData(supabase, signInData.user!.id)

      return NextResponse.json({
        user: signInData.user,
        session: signInData.session,
      })
    }

    // Normal login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
