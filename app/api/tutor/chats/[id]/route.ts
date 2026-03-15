import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = createServiceClient()

    // Delete messages first
    await supabase
      .from('ai_messages')
      .delete()
      .eq('chat_id', id)

    // Delete the chat
    const { error } = await supabase
      .from('ai_chats')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Chat deleted successfully' })
  } catch (error) {
    console.error('Delete chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
