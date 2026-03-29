export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ensureMockUser } from '@/lib/seed-user';

export async function GET(request: NextRequest) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id;

    const exams = await db.exam.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(
      exams.map((e) => ({
        id: e.id,
        user_id: e.userId,
        subject: e.title,
        exam_date: e.date.toISOString().split('T')[0],
        created_at: e.createdAt,
      }))
    );
  } catch (error) {
    console.error('List exams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureMockUser();
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id;

    const { subject, exam_date } = await request.json();

    if (!subject || !exam_date) {
      return NextResponse.json({ error: 'subject and exam_date are required' }, { status: 400 });
    }

    const exam = await db.exam.create({
      data: {
        title: subject,
        date: new Date(exam_date),
        userId,
      },
    });

    return NextResponse.json({
      id: exam.id,
      user_id: exam.userId,
      subject: exam.title,
      exam_date: exam.date.toISOString().split('T')[0],
      created_at: exam.createdAt,
    });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await db.exam.delete({ where: { id } });

    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
