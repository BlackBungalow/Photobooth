import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  projectSlug: z.string().min(1),
  photoId: z.string().min(1),
  copies: z.number().int().min(1).max(4).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { slug: parsed.data.projectSlug } });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  if (!project.printEnabled) {
    return NextResponse.json({ error: 'Print disabled' }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({ where: { id: parsed.data.photoId } });
  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  const job = await prisma.printJob.create({
    data: {
      projectId: project.id,
      photoId: photo.id
    }
  });

  await prisma.photo.update({
    where: { id: photo.id },
    data: { printStatus: 'QUEUED' }
  });

  return NextResponse.json({ jobId: job.id, status: job.status });
}
