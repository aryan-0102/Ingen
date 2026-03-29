export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureMockUser } from '@/lib/seed-user';

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    await ensureMockUser();

    const session = getSession();
    if (!session) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.id;

    // Get classes the user is a member of
    const memberships = await db.classMember.findMany({
      where: { userId },
      include: {
        class: {
          include: {
            creator: true,
            _count: {
              select: { members: true, files: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const enriched = memberships.map((m: any) => {
      const cls = m.class;
      return {
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        description: cls.description,
        code: cls.code,
        color: cls.color,
        meet_link: cls.meetLink,
        location: cls.location,
        visibility: cls.visibility,
        creator_id: cls.creatorId,
        member_count: cls._count.members,
        file_count: cls._count.files,
        creator_name: cls.creator.fullName || cls.creator.email,
        created_at: cls.createdAt,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Classes GET error:', error);
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

    const body = await request.json();
    const { name, subject, description, location, meet_link, visibility, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const code = generateClassCode();

    const newClass = await db.class.create({
      data: {
        name,
        subject: subject || 'General',
        description: description || null,
        location: location || null,
        meetLink: meet_link || null,
        visibility: visibility || 'public',
        color: color || null,
        code,
        creatorId: userId,
        members: {
          create: {
            userId: userId,
            role: 'owner'
          }
        }
      }
    });

    return NextResponse.json({
      class: { 
        id: newClass.id, 
        name: newClass.name, 
        subject: newClass.subject,
        code: newClass.code, 
        color: newClass.color,
        creator_id: newClass.creatorId,
        member_count: 1, 
        file_count: 0,
        created_at: newClass.createdAt,
      },
      id: newClass.id
    });
  } catch (error) {
    console.error('Classes POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
