import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-local-dev';

export interface UserPayload {
  id: string;
  email: string;
  fullName: string;
}

export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};

export const getSession = () => {
  return {
    id: 'test-user-id',
    email: 'admin@g',
    fullName: 'Test Setup User'
  };
};
