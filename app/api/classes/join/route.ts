import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, user_id } = await request.json()

    if (!code || !user_id) {
      return NextResponse.json(
        { error: 'code and user_id are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Find class by code
    const { data: cls, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (classError || !cls) {
      return NextResponse.json({ error: 'Class not found with that code' }, { status: 404 })
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', cls.id)
      .eq('user_id', user_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You are already a member of this class' },
        { status: 409 }
      )
    }

    // Join class
    const { error: joinError } = await supabase.from('class_members').insert({
      class_id: cls.id,
      user_id,
      role: 'member',
    })

    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 })
    }

    return NextResponse.json({ class: cls })
  } catch (error) {
    console.error('Join class error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
