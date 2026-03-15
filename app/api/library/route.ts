export const dynamic = "force-dynamic"

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    const search = request.nextUrl.searchParams.get('search')
    const tag = request.nextUrl.searchParams.get('tag')

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('library_files')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    if (search) {
      query = query.ilike('file_name', `%${search}%`)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: files, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ files: files || [] })
  } catch (error) {
    console.error('Library GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, class_id, file_name, file_type, file_size, storage_path, tags } =
      await request.json()

    if (!user_id || !file_name || !file_type || !storage_path) {
      return NextResponse.json(
        { error: 'user_id, file_name, file_type, and storage_path are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('library_files')
      .insert({
        user_id,
        class_id: class_id || null,
        file_name,
        file_type,
        file_size: file_size || 0,
        storage_path,
        tags: tags || [],
        ai_summary: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ file: data })
  } catch (error) {
    console.error('Library POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
