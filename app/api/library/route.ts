export const dynamic = 'force-dynamic';

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

    const search = request.nextUrl.searchParams.get('search');
    
    const files = await db.libraryFile.findMany({
      where: {
        uploadedById: userId,
        ...(search ? { name: { contains: search } } : {})
      },
      orderBy: { uploadedAt: 'desc' }
    });

    const formattedFiles = files.map((f: any) => ({
      id: f.id,
      user_id: f.uploadedById,
      class_id: f.classId,
      file_name: f.name,
      file_type: f.fileType,
      file_size: f.fileSize,
      storage_path: f.url,
      tags: JSON.parse(f.tags || '[]'),
      ai_summary: f.aiSummary,
      uploaded_at: f.uploadedAt,
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error('Library GET error:', error);
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

    const { class_id, file_name, file_type, file_size, storage_path, tags } = await request.json();

    if (!file_name || !storage_path) {
      return NextResponse.json(
        { error: 'file_name and storage_path are required' },
        { status: 400 }
      );
    }

    const file = await db.libraryFile.create({
      data: {
        name: file_name,
        fileSize: file_size || 0,
        fileType: file_type || 'unknown',
        url: storage_path,
        classId: class_id || null,
        uploadedById: userId,
        tags: JSON.stringify(tags || [])
      }
    });

    return NextResponse.json({
      file: {
        id: file.id,
        user_id: file.uploadedById,
        class_id: file.classId,
        file_name: file.name,
        file_type: file.fileType,
        file_size: file.fileSize,
        storage_path: file.url,
        tags: JSON.parse(file.tags || '[]'),
        ai_summary: file.aiSummary,
        uploaded_at: file.uploadedAt,
      }
    });
  } catch (error) {
    console.error('Library POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
