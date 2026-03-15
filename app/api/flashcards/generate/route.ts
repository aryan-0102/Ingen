import { createServiceClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, content, title, source_file_id } = await request.json()

    if (!user_id || !content) {
      return NextResponse.json(
        { error: 'user_id and content are required' },
        { status: 400 }
      )
    }

    // Generate flashcards using Gemini
    const prompt = `Based on the following content, generate a set of flashcards for studying. Create 10-15 flashcards that cover the key concepts, definitions, and important facts.

Content:
${content.substring(0, 8000)}

Return a JSON array of objects with "front" (question/term) and "back" (answer/definition) fields.
Example: [{"front": "What is photosynthesis?", "back": "The process by which plants convert sunlight into energy..."}]`

    const cards = await generateJSON(prompt)

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Failed to generate flashcards' },
        { status: 500 }
      )
    }

    const supabase = createServiceClient()

    // Create deck
    const { data: deck, error: deckError } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id,
        title: title || 'AI Generated Deck',
        source_file_id: source_file_id || null,
      })
      .select()
      .single()

    if (deckError) {
      return NextResponse.json({ error: deckError.message }, { status: 500 })
    }

    // Insert generated cards
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

    return NextResponse.json({
      ...deck,
      card_count: cards.length,
      cards: cardRows,
    })
  } catch (error) {
    console.error('Generate flashcards error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
