import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const backgroundSchema = z.object({
  name: z.string().min(1),
  s3Key: z.string().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export async function GET(_: Request, context: { params: { slug: string } }) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: context.params.slug }
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const backgrounds = await prisma.background.findMany({
    where: { projectId: project.id },
    orderBy: { sortOrder: 'asc' }
  });

  return NextResponse.json({ backgrounds });
}

export async function POST(request: Request, context: { params: { slug: string } }) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: context.params.slug }
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = backgroundSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const background = await prisma.background.create({
    data: {
      ...parsed.data,
      projectId: project.id
    }
  });

  return NextResponse.json({ background });
}
