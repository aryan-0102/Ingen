import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureMockUser } from '@/lib/seed-user';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;
    const { id } = await params;

    const chat = await db.chatSession.findUnique({ where: { id } });
    if (!chat || chat.userId !== userId) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await db.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(
      messages.map((m) => ({
        id: m.id,
        chat_id: m.sessionId,
        role: m.role,
        content: m.content,
        created_at: m.createdAt,
      }))
    );
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;
    const { id } = await params;

    const chat = await db.chatSession.findUnique({ where: { id } });
    if (!chat || chat.userId !== userId) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    await db.chatMessage.deleteMany({ where: { sessionId: id } });
    await db.chatSession.delete({ where: { id } });

    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
