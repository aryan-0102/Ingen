export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureMockUser } from '@/lib/seed-user';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureMockUser();
    const { id } = await params;

    const cls = await db.class.findUnique({
      where: { id },
      include: {
        creator: { select: { fullName: true, email: true } },
        _count: { select: { members: true, files: true } },
      },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({
      class: {
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        description: cls.description,
        code: cls.code,
        color: cls.color,
        meet_link: cls.meetLink,
        location: cls.location,
        creator_id: cls.creatorId,
        creator_name: cls.creator?.fullName || cls.creator?.email || 'Unknown',
        member_count: cls._count.members,
        file_count: cls._count.files,
        created_at: cls.createdAt,
      },
    });
  } catch (error) {
    console.error('Class GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, subject, description, color, meet_link, location } = await request.json();

    const cls = await db.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(meet_link !== undefined && { meetLink: meet_link }),
        ...(location !== undefined && { location }),
      },
    });

    return NextResponse.json({ class: cls });
  } catch (error) {
    console.error('Class PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await db.classMember.deleteMany({ where: { classId: id } });
    await db.libraryFile.deleteMany({ where: { classId: id } });
    await db.class.delete({ where: { id } });

    return NextResponse.json({ message: 'Class deleted' });
  } catch (error) {
    console.error('Class DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
