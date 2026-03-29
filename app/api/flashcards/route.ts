import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureMockUser } from '@/lib/seed-user';

export async function GET(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const deckId = request.nextUrl.searchParams.get('deck_id');

    // If deck_id is provided, return the cards for that deck (study mode)
    if (deckId) {
      const deck = await db.flashcardDeck.findUnique({
        where: { id: deckId },
        include: { cards: { orderBy: { createdAt: 'asc' } } },
      });

      if (!deck || deck.creatorId !== userId) {
        return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
      }

      return NextResponse.json(
        deck.cards.map((c) => ({
          id: c.id,
          deck_id: c.deckId,
          front: c.front,
          back: c.back,
          confidence: c.confidence,
          last_reviewed: c.lastReviewed,
          created_at: c.createdAt,
        }))
      );
    }

    // Otherwise return all decks for user
    const decks = await db.flashcardDeck.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const decksWithCounts = decks.map(deck => ({
      id: deck.id,
      user_id: deck.creatorId,
      title: deck.title,
      source_file_id: null,
      created_at: deck.createdAt,
      card_count: deck._count.cards
    }));

    return NextResponse.json(decksWithCounts);
  } catch (error) {
    console.error('List flashcard decks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const { title, cards } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Create deck and optionally cards in a transaction
    const deck = await db.flashcardDeck.create({
      data: {
        title,
        creatorId: userId,
        cards: cards && cards.length > 0 ? {
          create: cards.map((c: { front: string; back: string }) => ({
            front: c.front,
            back: c.back,
            confidence: 0,
          }))
        } : undefined
      },
      include: {
        _count: { select: { cards: true } }
      }
    });

    return NextResponse.json({
      id: deck.id,
      user_id: deck.creatorId,
      title: deck.title,
      created_at: deck.createdAt,
      card_count: deck._count.cards,
    });
  } catch (error) {
    console.error('Create flashcard deck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
