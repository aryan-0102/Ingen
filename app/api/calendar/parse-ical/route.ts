import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url, user_id } = await request.json()

    if (!url || !user_id) {
      return NextResponse.json(
        { error: 'url and user_id are required' },
        { status: 400 }
      )
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Save the calendar URL to the user's profile
    const { error } = await supabase
      .from('profiles')
      .update({ google_calendar_url: url })
      .eq('id', user_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Calendar URL saved successfully',
      url,
    })
  } catch (error) {
    console.error('Parse iCal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
