import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id;

    const { id } = await params;

    const file = await db.libraryFile.findUnique({ where: { id } });
    if (!file || file.uploadedById !== userId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from local storage if it's a local path
    if (file.url && file.url.startsWith('/uploads/')) {
      try {
        const localPath = join(process.cwd(), 'public', file.url);
        await unlink(localPath);
      } catch {
        // File may already be gone, continue
      }
    }

    await db.libraryFile.delete({ where: { id } });

    return NextResponse.json({ message: 'File deleted' });
  } catch (error) {
    console.error('Delete library file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
