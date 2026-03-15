import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    const { data: members, error } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', params.id)
      .order('joined_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with profile info
    const userIds = (members || []).map((m) => m.user_id)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    )

    const enriched = (members || []).map((m) => ({
      ...m,
      full_name: profileMap.get(m.user_id)?.full_name || 'Unknown',
      email: profileMap.get(m.user_id)?.email || '',
    }))

    return NextResponse.json({ members: enriched })
  } catch (error) {
    console.error('Members GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id_to_remove } = await request.json()

    if (!user_id_to_remove) {
      return NextResponse.json(
        { error: 'user_id_to_remove is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', params.id)
      .eq('user_id', user_id_to_remove)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Members DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
