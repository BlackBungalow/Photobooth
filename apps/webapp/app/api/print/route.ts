import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { createReadUrl } from '@/lib/s3';

const schema = z.object({
  photoId: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({
    where: { id: parsed.data.photoId },
    include: { project: true }
  });

  if (!photo || !photo.project.printEnabled) {
    return NextResponse.json({ error: 'Print disabled' }, { status: 400 });
  }

  if (!env.PRINT_SERVER_URL) {
    return NextResponse.json({ error: 'Print server not configured' }, { status: 500 });
  }

  const signedUrl = env.SIGNED_URLS_ENABLED === 'true' ? await createReadUrl(photo.s3Key) : null;

  const response = await fetch(`${env.PRINT_SERVER_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.PRINT_SERVER_API_KEY ?? ''
    },
    body: JSON.stringify({
      photoId: photo.id,
      imageUrl: signedUrl ?? photo.publicUrl ?? photo.s3Key,
      projectSlug: photo.project.slug
    })
  });

  if (!response.ok) {
    await prisma.photo.update({
      where: { id: photo.id },
      data: { printStatus: 'ERROR' }
    });

    return NextResponse.json({ error: 'Print failed' }, { status: 500 });
  }

  const data = await response.json();
  await prisma.photo.update({
    where: { id: photo.id },
    data: { printStatus: 'PRINTING' }
  });

  return NextResponse.json({ status: data.status ?? 'PRINTING' });
}
