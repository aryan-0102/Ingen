import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id;

    const { id } = await params;

    const deck = await db.flashcardDeck.findUnique({ where: { id } });
    if (!deck || deck.creatorId !== userId) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Delete all cards first, then the deck
    await db.flashcard.deleteMany({ where: { deckId: id } });
    await db.flashcardDeck.delete({ where: { id } });

    return NextResponse.json({ message: 'Deck deleted' });
  } catch (error) {
    console.error('Delete deck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
