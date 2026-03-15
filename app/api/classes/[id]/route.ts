import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    const { data: cls, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get counts and creator info
    const [{ count: memberCount }, { count: fileCount }, { data: creator }] =
      await Promise.all([
        supabase
          .from('class_members')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id),
        supabase
          .from('library_files')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id),
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', cls.creator_id)
          .single(),
      ])

    return NextResponse.json({
      class: {
        ...cls,
        member_count: memberCount || 0,
        file_count: fileCount || 0,
        creator_name: creator?.full_name || 'Unknown',
      },
    })
  } catch (error) {
    console.error('Class GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('classes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ class: data })
  } catch (error) {
    console.error('Class PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    // Delete members first
    await supabase.from('class_members').delete().eq('class_id', params.id)

    // Delete associated files metadata
    await supabase.from('library_files').delete().eq('class_id', params.id)

    // Delete class
    const { error } = await supabase.from('classes').delete().eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Class deleted' })
  } catch (error) {
    console.error('Class DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
