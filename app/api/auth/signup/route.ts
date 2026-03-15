import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json()

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Insert profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
      email,
      role,
      avatar_url: null,
      google_calendar_url: null,
      default_meet_link: null,
      study_hours_per_day: 4,
      preferred_times: ['morning', 'evening'],
      theme: 'light',
    })

    if (profileError) {
      console.error('Profile insert error:', profileError)
    }

    // Sign in to get session
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      return NextResponse.json(
        { error: 'Account created but sign-in failed. Please sign in manually.' },
        { status: 201 }
      )
    }

    return NextResponse.json({
      user: signInData.user,
      session: signInData.session,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
