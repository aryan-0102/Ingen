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

    const { data: decks, error } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get card counts for each deck
    const decksWithCounts = await Promise.all(
      (decks || []).map(async (deck) => {
        const { count } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('deck_id', deck.id)

        return { ...deck, card_count: count || 0 }
      })
    )

    return NextResponse.json(decksWithCounts)
  } catch (error) {
    console.error('List flashcard decks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, title, source_file_id, cards } = await request.json()

    if (!user_id || !title) {
      return NextResponse.json(
        { error: 'user_id and title are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Create deck
    const { data: deck, error: deckError } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id,
        title,
        source_file_id: source_file_id || null,
      })
      .select()
      .single()

    if (deckError) {
      return NextResponse.json({ error: deckError.message }, { status: 500 })
    }

    // Insert cards if provided
    if (cards && cards.length > 0) {
      const cardRows = cards.map((card: { front: string; back: string }) => ({
        deck_id: deck.id,
        front: card.front,
        back: card.back,
        mastered: false,
      }))

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(cardRows)

      if (cardsError) {
        return NextResponse.json({ error: cardsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ...deck, card_count: cards?.length || 0 })
  } catch (error) {
    console.error('Create flashcard deck error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
