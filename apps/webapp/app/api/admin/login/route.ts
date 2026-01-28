import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueAdminSession, verifyAdminCredentials } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const isValid = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  issueAdminSession();
  return NextResponse.json({ success: true });
}
