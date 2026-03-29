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

    const chats = await db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedChats = chats.map(c => ({
      id: c.id,
      user_id: c.userId,
      title: c.title,
      created_at: c.createdAt,
      updated_at: c.updatedAt
    }));

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error('List chats error:', error);
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

    const { title } = await request.json();

    const newChat = await db.chatSession.create({
      data: {
        userId,
        title: title || 'New Chat'
      }
    });

    return NextResponse.json({
      id: newChat.id,
      user_id: newChat.userId,
      title: newChat.title,
      created_at: newChat.createdAt,
      updated_at: newChat.updatedAt
    });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
