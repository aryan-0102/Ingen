import { generateJSON } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ensureMockUser } from '@/lib/seed-user';

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const { content, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    // Generate flashcards using Gemini
    const prompt = `Based on the following content, generate a set of flashcards for studying. Create 10-15 flashcards that cover the key concepts, definitions, and important facts.

Content:
${content.substring(0, 8000)}

Return a JSON array of objects with "front" (question/term) and "back" (answer/definition) fields.
Example: [{"front": "What is photosynthesis?", "back": "The process by which plants convert sunlight into energy..."}]`;

    const cards = await generateJSON(prompt);

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Failed to generate flashcards' },
        { status: 500 }
      );
    }

    const deck = await db.flashcardDeck.create({
      data: {
        title: title || 'AI Generated Deck',
        creatorId: userId,
        cards: {
          create: cards.map((card: { front: string; back: string }) => ({
            front: card.front,
            back: card.back,
            confidence: 0,
          })),
        },
      },
      include: {
        _count: { select: { cards: true } },
      },
    });

    return NextResponse.json({
      id: deck.id,
      user_id: deck.creatorId,
      title: deck.title,
      created_at: deck.createdAt,
      card_count: deck._count.cards,
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
