import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createReadUrl, s3, resolvePublicUrl } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';
import { emitPhoto } from '@/lib/socket';

const schema = z.object({
  projectSlug: z.string().min(1),
  imageBase64: z.string().min(1),
  isPublic: z.boolean().default(true),
  backgroundId: z.string().optional().nullable()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { slug: parsed.data.projectSlug }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const buffer = Buffer.from(parsed.data.imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const timestamp = new Date();
  const key = `p/${project.slug}/${timestamp.getFullYear()}/${timestamp.getMonth() + 1}/${timestamp.getDate()}/${Date.now()}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg'
    })
  );

  const publicUrl = resolvePublicUrl(key);

  const photo = await prisma.photo.create({
    data: {
      projectId: project.id,
      s3Key: key,
      publicUrl,
      isPublic: parsed.data.isPublic,
      backgroundId: parsed.data.backgroundId ?? undefined
    }
  });

  if (photo.isPublic) {
    const socketUrl =
      publicUrl ?? (env.SIGNED_URLS_ENABLED === 'true' ? await createReadUrl(photo.s3Key) : null);
    emitPhoto(project.slug, { id: photo.id, publicUrl: socketUrl, createdAt: photo.createdAt });
  }

  return NextResponse.json({ photo });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const photos = await prisma.photo.findMany({
    where: { projectId: project.id, isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  const withUrls = await Promise.all(
    photos.map(async (photo) => {
      if (photo.publicUrl) {
        return photo;
      }
      if (env.SIGNED_URLS_ENABLED === 'true') {
        const signedUrl = await createReadUrl(photo.s3Key);
        return { ...photo, publicUrl: signedUrl };
      }
      return photo;
    })
  );

  return NextResponse.json({ photos: withUrls });
}
