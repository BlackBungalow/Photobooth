import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createReadUrl, resolvePublicUrl } from '@/lib/s3';
import { env } from '@/lib/env';

export async function GET(_: Request, context: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({
    where: { slug: context.params.slug },
    include: { backgrounds: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } }
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const backgrounds = await Promise.all(
    project.backgrounds.map(async (bg) => ({
      ...bg,
      publicUrl:
        resolvePublicUrl(bg.s3Key) ??
        (env.SIGNED_URLS_ENABLED === 'true' ? await createReadUrl(bg.s3Key) : null)
    }))
  );

  return NextResponse.json({
    project: {
      ...project,
      backgrounds
    }
  });
}
