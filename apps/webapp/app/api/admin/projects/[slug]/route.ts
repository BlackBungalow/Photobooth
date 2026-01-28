import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
  messageBottom: z.string().optional().nullable(),
  printEnabled: z.boolean().optional(),
  screenMode: z.enum(['GRID', 'SLIDESHOW']).optional(),
  screenSpeed: z.number().min(1).max(30).optional(),
  jpegQuality: z.number().min(0.5).max(1).optional(),
  cameraFacingMode: z.enum(['user', 'environment']).optional(),
  isS3Public: z.boolean().optional()
});

export async function GET(_: Request, context: { params: { slug: string } }) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: context.params.slug },
    include: { backgrounds: true }
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PUT(request: Request, context: { params: { slug: string } }) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { slug: context.params.slug },
    data: parsed.data
  });

  return NextResponse.json({ project });
}
