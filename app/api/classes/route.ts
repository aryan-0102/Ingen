export const dynamic = "force-dynamic"

import { createServiceClient } from '@/lib/supabase/server'
import { generateClassCode } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get class IDs the user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from('class_members')
      .select('class_id, role')
      .eq('user_id', userId)

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ classes: [] })
    }

    const classIds = memberships.map((m) => m.class_id)

    // Get classes
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('*')
      .in('id', classIds)
      .order('created_at', { ascending: false })

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 })
    }

    // Enrich with counts
    const enriched = await Promise.all(
      (classes || []).map(async (cls) => {
        const [{ count: memberCount }, { count: fileCount }] = await Promise.all([
          supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('class_id', cls.id),
          supabase.from('library_files').select('*', { count: 'exact', head: true }).eq('class_id', cls.id),
        ])

        // Get creator name
        const { data: creator } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', cls.creator_id)
          .single()

        return {
          ...cls,
          member_count: memberCount || 0,
          file_count: fileCount || 0,
          creator_name: creator?.full_name || 'Unknown',
        }
      })
    )

    return NextResponse.json({ classes: enriched })
  } catch (error) {
    console.error('Classes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, subject, description, location, meet_link, visibility, color, user_id } =
      await request.json()

    if (!name || !subject || !user_id) {
      return NextResponse.json(
        { error: 'name, subject, and user_id are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const code = generateClassCode()

    // Create class
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        name,
        subject,
        code,
        description: description || null,
        location: location || null,
        meet_link: meet_link || null,
        visibility: visibility || 'public',
        color: color || '#0EA5E9',
        creator_id: user_id,
      })
      .select()
      .single()

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 })
    }

    // Add creator as owner
    const { error: memberError } = await supabase.from('class_members').insert({
      class_id: newClass.id,
      user_id,
      role: 'owner',
    })

    if (memberError) {
      console.error('Member insert error:', memberError)
    }

    return NextResponse.json({
      class: { ...newClass, member_count: 1, file_count: 0 },
    })
  } catch (error) {
    console.error('Classes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
