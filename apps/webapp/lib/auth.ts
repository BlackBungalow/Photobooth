import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { env } from './env';

const COOKIE_NAME = 'photobooth_admin';

export async function verifyAdminCredentials(email: string, password: string) {
  const isEmailMatch = email === env.ADMIN_EMAIL;
  const isHashed = env.ADMIN_PASSWORD.startsWith('$2');
  const isPasswordMatch = isHashed ? await bcrypt.compare(password, env.ADMIN_PASSWORD) : password === env.ADMIN_PASSWORD;
  return isEmailMatch && isPasswordMatch;
}

export function issueAdminSession() {
  const token = jwt.sign({ role: 'admin' }, env.ADMIN_PASSWORD, {
    expiresIn: '12h'
  });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
}

export function clearAdminSession() {
  cookies().set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export function requireAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  try {
    const payload = jwt.verify(token, env.ADMIN_PASSWORD) as { role?: string };
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
