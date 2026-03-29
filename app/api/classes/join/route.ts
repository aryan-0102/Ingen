import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureMockUser } from '@/lib/seed-user';

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id;

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }

    // Find class by code
    const cls = await db.class.findFirst({
      where: { code: code.toUpperCase() },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Class not found with that code' }, { status: 404 });
    }

    // Check already a member
    const existing = await db.classMember.findFirst({
      where: { classId: cls.id, userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You are already a member of this class' },
        { status: 409 }
      );
    }

    // Join class
    await db.classMember.create({
      data: { classId: cls.id, userId, role: 'member' },
    });

    return NextResponse.json({
      class: {
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        code: cls.code,
        color: cls.color,
        creator_id: cls.creatorId,
        created_at: cls.createdAt,
      },
    });
  } catch (error) {
    console.error('Join class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
