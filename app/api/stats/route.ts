export const dynamic = "force-dynamic"

import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Run all queries in parallel
    const [classesResult, filesResult, streakResult, chatsResult] =
      await Promise.all([
        supabase
          .from('class_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('library_files')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('study_streaks')
          .select('current_streak')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('ai_chats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ])

    return NextResponse.json({
      activeClasses: classesResult.count || 0,
      libraryFiles: filesResult.count || 0,
      studyStreak: streakResult.data?.current_streak || 0,
      aiChats: chatsResult.count || 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
