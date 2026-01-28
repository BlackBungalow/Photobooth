import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const projectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().url().optional().nullable(),
  messageBottom: z.string().optional().nullable(),
  printEnabled: z.boolean().default(true),
  screenMode: z.enum(['GRID', 'SLIDESHOW']).default('GRID'),
  screenSpeed: z.number().min(1).max(30).default(5),
  jpegQuality: z.number().min(0.5).max(1).default(0.92),
  cameraFacingMode: z.enum(['user', 'environment']).default('user'),
  isS3Public: z.boolean().default(false)
});

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: parsed.data
  });

  return NextResponse.json({ project });
}
