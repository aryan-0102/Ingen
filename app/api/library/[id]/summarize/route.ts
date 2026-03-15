import { createServiceClient } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    // Get file record
    const { data: file, error: fetchError } = await supabase
      .from('library_files')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Return existing summary if available
    if (file.ai_summary) {
      return NextResponse.json({ summary: file.ai_summary })
    }

    // Try to get file content from storage
    let textContent = ''

    const textTypes = ['txt', 'md', 'csv', 'json']
    if (textTypes.includes(file.file_type.toLowerCase())) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('library-files')
        .download(file.storage_path)

      if (!downloadError && fileData) {
        textContent = await fileData.text()
      }
    }

    // If we couldn't get text, use the filename and type as context
    if (!textContent) {
      textContent = `File: ${file.file_name} (${file.file_type} file, ${file.file_size} bytes). Tags: ${(file.tags || []).join(', ') || 'none'}.`
    }

    // Truncate content if too long
    if (textContent.length > 10000) {
      textContent = textContent.slice(0, 10000) + '...'
    }

    const prompt = `Summarize this study material in 4-5 concise bullet points that would help a student review. Focus on key concepts, formulas, and important takeaways.\n\nMaterial:\n${textContent}`

    const summary = await generateAIResponse(prompt)

    // Save summary
    await supabase
      .from('library_files')
      .update({ ai_summary: summary })
      .eq('id', params.id)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
