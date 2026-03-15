import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    const { data: files, error } = await supabase
      .from('library_files')
      .select('*')
      .eq('class_id', params.id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ files: files || [] })
  } catch (error) {
    console.error('Class files GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
