import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateAIResponse } from '@/lib/gemini';
import { ensureMockUser } from '@/lib/seed-user';

const SYSTEM_PROMPT = `You are InGen AI Tutor, a friendly and knowledgeable academic assistant. You help students understand concepts, solve problems, and prepare for exams. Your responses should be:
- Clear and concise
- Use examples when helpful
- Encourage critical thinking
- Break down complex topics into digestible parts
- Use markdown formatting for better readability
If asked to generate a quiz, create 5 multiple-choice questions with answers.`;

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    const { chat_id, content, quick_action } = await request.json();

    if (!chat_id || !content) {
      return NextResponse.json(
        { error: 'chat_id and content are required' },
        { status: 400 }
      );
    }

    // Verify chat belongs to user
    const chat = await db.chatSession.findUnique({ where: { id: chat_id } });
    if (!chat || chat.userId !== userId) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Save user message
    const userMsg = await db.chatMessage.create({
      data: {
        sessionId: chat_id,
        role: 'user',
        content,
      }
    });

    // Get conversation history (last 10 messages)
    const history = await db.chatMessage.findMany({
      where: { sessionId: chat_id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const conversationContext = history
      .reverse()
      .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Build prompt
    let prompt = conversationContext;
    if (quick_action === 'quiz') {
      prompt += '\n\nGenerate a 5-question multiple choice quiz on the topic we have been discussing. Include answers at the end.';
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(prompt, SYSTEM_PROMPT);

    // Save AI message
    const aiMsg = await db.chatMessage.create({
      data: {
        sessionId: chat_id,
        role: 'assistant',
        content: aiResponse,
      }
    });

    // Update chat title if it's the first message
    if (chat.title === 'New Chat') {
      const title = content.length > 40 ? content.substring(0, 40) + '...' : content;
      await db.chatSession.update({
        where: { id: chat_id },
        data: { title }
      });
    }

    await db.chatSession.update({
      where: { id: chat_id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      userMessage: {
        id: userMsg.id,
        chat_id: userMsg.sessionId,
        role: userMsg.role,
        content: userMsg.content,
        created_at: userMsg.createdAt,
      },
      aiMessage: {
        id: aiMsg.id,
        chat_id: aiMsg.sessionId,
        role: aiMsg.role,
        content: aiMsg.content,
        created_at: aiMsg.createdAt,
      }
    });
  } catch (error) {
    console.error('Tutor send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
