import { createServiceClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are InGen AI Tutor, a friendly and knowledgeable academic assistant. You help students understand concepts, solve problems, and prepare for exams. Your responses should be:
- Clear and concise
- Use examples when helpful
- Encourage critical thinking
- Break down complex topics into digestible parts
- Use markdown formatting for better readability
If asked to generate a quiz, create 5 multiple-choice questions with answers.`

export async function POST(request: NextRequest) {
  try {
    const { chat_id, user_id, content, quick_action } = await request.json()

    if (!chat_id || !user_id || !content) {
      return NextResponse.json(
        { error: 'chat_id, user_id, and content are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Save user message
    const { error: userMsgError } = await supabase
      .from('ai_messages')
      .insert({
        chat_id,
        role: 'user',
        content,
      })

    if (userMsgError) {
      return NextResponse.json({ error: userMsgError.message }, { status: 500 })
    }

    // Get conversation history (last 10 messages)
    const { data: history } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const conversationContext = (history || [])
      .reverse()
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    // Build prompt
    let prompt = conversationContext
    if (quick_action === 'quiz') {
      prompt += '\n\nGenerate a 5-question multiple choice quiz on the topic we have been discussing. Include answers at the end.'
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(prompt, SYSTEM_PROMPT)

    // Save AI message
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from('ai_messages')
      .insert({
        chat_id,
        role: 'assistant',
        content: aiResponse,
      })
      .select()
      .single()

    if (aiMsgError) {
      return NextResponse.json({ error: aiMsgError.message }, { status: 500 })
    }

    // Update chat title if it's the first message (title is still "New Chat")
    const { data: chat } = await supabase
      .from('ai_chats')
      .select('title')
      .eq('id', chat_id)
      .single()

    if (chat?.title === 'New Chat') {
      const title = content.length > 40 ? content.substring(0, 40) + '...' : content
      await supabase
        .from('ai_chats')
        .update({ title })
        .eq('id', chat_id)
    }

    // Update chat's updated_at
    await supabase
      .from('ai_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_id)

    return NextResponse.json(aiMsg)
  } catch (error) {
    console.error('Tutor send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
