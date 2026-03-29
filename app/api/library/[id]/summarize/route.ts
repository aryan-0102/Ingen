import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAIResponse } from '@/lib/gemini';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ensureMockUser } from '@/lib/seed-user';
const pdfParse = require('pdf-parse');

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureMockUser();
    const { id } = await params;

    const file = await db.libraryFile.findUnique({ where: { id } });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Return existing summary if available
    if (file.aiSummary) {
      return NextResponse.json({ summary: file.aiSummary });
    }

    // Try to read file content from local disk
    let textContent = '';
    const textExtensions = ['txt', 'md', 'csv', 'json'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (file.url && file.url.startsWith('/uploads/')) {
      try {
        const localPath = join(process.cwd(), 'public', file.url);
        
        if (textExtensions.includes(ext)) {
          textContent = await readFile(localPath, 'utf-8');
        } else if (ext === 'pdf') {
          const dataBuffer = await readFile(localPath);
          const pdfData = await pdfParse(dataBuffer);
          textContent = pdfData.text;
        }
      } catch (err) {
        console.error('File parsing error:', err);
        // File can't be read, fall through to filename context
      }
    }

    // Fallback: describe the file using metadata
    if (!textContent) {
      let parsedTags = [];
      try {
        parsedTags = typeof file.tags === 'string' ? JSON.parse(file.tags) : (file.tags || []);
      } catch (e) {}
      textContent = `File: ${file.name} (${file.fileType} file, ${file.fileSize} bytes). Tags: ${parsedTags.join(', ') || 'none'}.`;
    }

    if (textContent.length > 10000) {
      textContent = textContent.slice(0, 10000) + '...';
    }

    const prompt = `Summarize this study material in 4-5 concise bullet points that would help a student review. Focus on key concepts, formulas, and important takeaways.\n\nMaterial:\n${textContent}`;

    const summary = await generateAIResponse(prompt);

    // Save summary back to DB
    await db.libraryFile.update({
      where: { id },
      data: { aiSummary: summary },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
