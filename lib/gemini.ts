import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function generateAIResponse(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const messages: any[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
    })

    return chatCompletion.choices[0]?.message?.content || ''
  } catch (error: any) {
    console.error('Groq API error:', error)
    return 'I apologize, but I encountered an error generating a response. Please check your Groq API key configuration and try again.'
  }
}

export async function generateJSON(prompt: string): Promise<any> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt + '\n\nRespond ONLY with valid JSON, no markdown code blocks or extra text.' }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
    })
    
    const text = chatCompletion.choices[0]?.message?.content || '{}'
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanText)
  } catch (error: any) {
    console.error('Groq JSON error:', error)
    return null
  }
}
