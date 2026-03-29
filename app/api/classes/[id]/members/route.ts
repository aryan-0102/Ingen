export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const members = await db.classMember.findMany({
      where: { classId: id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        class_id: m.classId,
        user_id: m.userId,
        role: m.role,
        joined_at: m.joinedAt,
        full_name: m.user?.fullName || 'Unknown',
        email: m.user?.email || '',
      })),
    });
  } catch (error) {
    console.error('Members GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id_to_remove } = await request.json();

    if (!user_id_to_remove) {
      return NextResponse.json({ error: 'user_id_to_remove is required' }, { status: 400 });
    }

    await db.classMember.deleteMany({
      where: { classId: id, userId: user_id_to_remove },
    });

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Members DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
