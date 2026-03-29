import { db } from '@/lib/db';
import { ensureMockUser } from '@/lib/seed-user';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    await ensureMockUser();

    // Check if already seeded (user has class memberships)
    const existingCount = await db.classMember.count({
      where: { userId: user_id },
    });

    if (existingCount > 0) {
      return NextResponse.json({ message: 'Already seeded', seeded: false });
    }

    // Create 3 demo classes with memberships
    const classesData = [
      {
        name: 'Calculus II',
        subject: 'Mathematics',
        code: 'MATH02',
        description: 'Advanced integration techniques and series',
        color: '#6366f1',
      },
      {
        name: 'Physics 101',
        subject: 'Physics',
        code: 'PHYS01',
        description: 'Classical mechanics and thermodynamics',
        color: '#f59e0b',
      },
      {
        name: 'Intro to CS',
        subject: 'Computer Science',
        code: 'COMP01',
        description: 'Algorithms, data structures, and programming',
        color: '#10b981',
      },
    ];

    const createdClasses = [];
    for (const cls of classesData) {
      // Check if class code already exists
      const existing = await db.class.findFirst({ where: { code: cls.code } });
      if (existing) {
        createdClasses.push(existing);
        // Ensure membership exists
        const memberExists = await db.classMember.findFirst({
          where: { classId: existing.id, userId: user_id },
        });
        if (!memberExists) {
          await db.classMember.create({
            data: { classId: existing.id, userId: user_id, role: 'owner' },
          });
        }
        continue;
      }

      const newClass = await db.class.create({
        data: {
          name: cls.name,
          subject: cls.subject,
          code: cls.code,
          description: cls.description,
          color: cls.color,
          creatorId: user_id,
          members: {
            create: { userId: user_id, role: 'owner' },
          },
        },
      });
      createdClasses.push(newClass);
    }

    // Create 5 demo library files
    const filesData = [
      {
        name: 'Integration_Techniques.pdf',
        fileType: 'application/pdf',
        fileSize: 2456000,
        url: '/uploads/demo_integration.pdf',
        tags: JSON.stringify(['calculus', 'integration']),
        classId: createdClasses[0]?.id || null,
        uploadedById: user_id,
      },
      {
        name: 'Series_Convergence_Notes.pdf',
        fileType: 'application/pdf',
        fileSize: 1823000,
        url: '/uploads/demo_series.pdf',
        tags: JSON.stringify(['calculus', 'series']),
        classId: createdClasses[0]?.id || null,
        uploadedById: user_id,
      },
      {
        name: 'Newton_Laws_Summary.pdf',
        fileType: 'application/pdf',
        fileSize: 984000,
        url: '/uploads/demo_newton.pdf',
        tags: JSON.stringify(['physics', 'mechanics']),
        classId: createdClasses[1]?.id || null,
        uploadedById: user_id,
      },
      {
        name: 'Thermodynamics_Formulas.png',
        fileType: 'image/png',
        fileSize: 567000,
        url: '/uploads/demo_thermo.png',
        tags: JSON.stringify(['physics', 'thermodynamics']),
        classId: createdClasses[1]?.id || null,
        uploadedById: user_id,
      },
      {
        name: 'Sorting_Algorithms.md',
        fileType: 'text/markdown',
        fileSize: 34000,
        url: '/uploads/demo_sorting.md',
        tags: JSON.stringify(['cs', 'algorithms']),
        classId: createdClasses[2]?.id || null,
        uploadedById: user_id,
      },
    ];

    for (const file of filesData) {
      await db.libraryFile.create({ data: file });
    }

    // Create 5 demo calendar events
    const eventsData = [
      {
        userId: user_id,
        title: 'Calculus II Lecture',
        eventType: 'class',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:30',
        subject: 'Mathematics',
        color: '#6366f1',
      },
      {
        userId: user_id,
        title: 'Physics Lab',
        eventType: 'class',
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '16:00',
        subject: 'Physics',
        color: '#f59e0b',
      },
      {
        userId: user_id,
        title: 'CS Lecture',
        eventType: 'class',
        dayOfWeek: 3,
        startTime: '11:00',
        endTime: '12:30',
        subject: 'Computer Science',
        color: '#10b981',
      },
      {
        userId: user_id,
        title: 'Study: Integration Practice',
        eventType: 'study',
        dayOfWeek: 4,
        startTime: '16:00',
        endTime: '18:00',
        subject: 'Mathematics',
        color: '#8b5cf6',
      },
      {
        userId: user_id,
        title: 'Algorithm Review',
        eventType: 'study',
        dayOfWeek: 5,
        startTime: '10:00',
        endTime: '11:30',
        subject: 'Computer Science',
        color: '#06b6d4',
      },
    ];

    for (const event of eventsData) {
      await db.calendarEvent.create({ data: event });
    }

    // Create 1 demo AI chat with 2 messages
    const chat = await db.chatSession.create({
      data: {
        userId: user_id,
        title: 'Help with Chain Rule',
      },
    });

    await db.chatMessage.createMany({
      data: [
        {
          sessionId: chat.id,
          role: 'user',
          content: 'Can you explain the chain rule in calculus?',
        },
        {
          sessionId: chat.id,
          role: 'assistant',
          content:
            'The **chain rule** is used to differentiate composite functions. If you have f(g(x)), the derivative is:\n\n**f\'(g(x)) · g\'(x)**\n\nThink of it as the "outer derivative times the inner derivative."\n\n**Example:** Find d/dx [sin(x²)]\n- Outer function: sin(u), derivative: cos(u)\n- Inner function: x², derivative: 2x\n- Result: cos(x²) · 2x = **2x·cos(x²)**',
        },
      ],
    });

    // Create study stats
    const existingStats = await db.userStats.findUnique({ where: { userId: user_id } });
    if (!existingStats) {
      await db.userStats.create({
        data: {
          userId: user_id,
          studyStreak: 5,
          cardsReviewed: 42,
          timeSpent: 720,
          lastStudyDate: new Date(),
        },
      });
    }

    // Create 2 demo exams
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    await db.exam.createMany({
      data: [
        {
          title: 'Mathematics',
          date: nextWeek,
          userId: user_id,
        },
        {
          title: 'Physics',
          date: nextMonth,
          userId: user_id,
        },
      ],
    });

    return NextResponse.json({
      message: 'Demo data seeded successfully',
      seeded: true,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
