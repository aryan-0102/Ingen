import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateAIResponse(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error('Gemini API error:', error)
    return 'I apologize, but I encountered an error generating a response. Please check your Gemini API key configuration and try again.'
  }
}

export async function generateJSON(prompt: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt + '\n\nRespond ONLY with valid JSON, no markdown code blocks or extra text.')
    const response = await result.response
    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(text)
  } catch (error: any) {
    console.error('Gemini JSON error:', error)
    return null
  }
}
