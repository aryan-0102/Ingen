export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const files = await db.libraryFile.findMany({
      where: { classId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      files: files.map((f: any) => ({
        id: f.id,
        file_name: f.name,
        file_type: f.fileType,
        file_size: f.fileSize,
        storage_path: f.url,
        tags: JSON.parse(f.tags || '[]'),
        class_id: f.classId,
        uploaded_by: f.uploadedById,
        uploaded_at: f.uploadedAt,
      })),
    });
  } catch (error) {
    console.error('Class files GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
