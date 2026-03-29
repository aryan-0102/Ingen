import { db } from './db';

const MOCK_USER_ID = 'test-user-id';

export async function ensureMockUser() {
  const existing = await db.user.findUnique({ where: { id: MOCK_USER_ID } });
  if (!existing) {
    await db.user.create({
      data: {
        id: MOCK_USER_ID,
        email: 'admin@g',
        passwordHash: 'mock-hash',
        fullName: 'Test Setup User',
      },
    });
  }
}
