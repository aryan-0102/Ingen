import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ensureMockUser } from '@/lib/seed-user';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use /tmp on Vercel (read-only fs), public/uploads locally
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel
      ? join('/tmp', 'uploads')
      : join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}_${sanitized}`;
    const filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      storage_path: isVercel ? `/tmp/uploads/${filename}` : `/uploads/${filename}`,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
