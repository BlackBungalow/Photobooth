import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createUploadUrl } from '@/lib/s3';

const schema = z.object({
  projectSlug: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1)
});

export async function POST(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!parsed.data.contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  const key = `p/${parsed.data.projectSlug}/assets/${Date.now()}-${parsed.data.filename}`;
  const uploadUrl = await createUploadUrl(key, parsed.data.contentType);

  return NextResponse.json({ uploadUrl, key });
}
