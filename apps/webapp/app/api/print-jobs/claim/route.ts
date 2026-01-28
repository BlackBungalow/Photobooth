import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { createReadUrl } from '@/lib/s3';

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-print-agent-key');
  if (!env.PRINT_AGENT_KEY || apiKey !== env.PRINT_AGENT_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agentId = request.headers.get('x-print-agent-id') ?? 'agent';

  const job = await prisma.$transaction(async (tx) => {
    const nextJob = await tx.printJob.findFirst({
      where: { status: 'QUEUED', lockedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    if (!nextJob) {
      return null;
    }

    const updated = await tx.printJob.updateMany({
      where: { id: nextJob.id, status: 'QUEUED', lockedAt: null },
      data: {
        status: 'PRINTING',
        lockedAt: new Date(),
        lockedBy: agentId,
        attempts: { increment: 1 }
      }
    });

    if (updated.count === 0) {
      return null;
    }

    const claimed = await tx.printJob.findUnique({ where: { id: nextJob.id } });
    if (!claimed) {
      return null;
    }

    await tx.photo.update({
      where: { id: claimed.photoId },
      data: { printStatus: 'PRINTING' }
    });

    return claimed;
  });

  if (!job) {
    return NextResponse.json({ job: null });
  }

  const photo = await prisma.photo.findUnique({
    where: { id: job.photoId }
  });

  if (!photo) {
    return NextResponse.json({ job: null });
  }

  const imageUrl =
    photo.publicUrl ?? (env.SIGNED_URLS_ENABLED === 'true' ? await createReadUrl(photo.s3Key) : null);

  if (!imageUrl) {
    await prisma.printJob.update({
      where: { id: job.id },
      data: { status: 'ERROR', errorMessage: 'Missing image URL' }
    });
    await prisma.photo.update({ where: { id: photo.id }, data: { printStatus: 'ERROR' } });
    return NextResponse.json({ job: null });
  }

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      projectId: job.projectId,
      photoId: job.photoId,
      imageUrl
    }
  });
}
