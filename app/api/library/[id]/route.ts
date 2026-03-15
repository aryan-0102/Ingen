import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    // Get file record to find storage path
    const { data: file, error: fetchError } = await supabase
      .from('library_files')
      .select('storage_path')
      .eq('id', params.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from storage
    if (file.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('library-files')
        .remove([file.storage_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }
    }

    // Delete metadata record
    const { error: deleteError } = await supabase
      .from('library_files')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'File deleted' })
  } catch (error) {
    console.error('Library DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
