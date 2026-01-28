import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

const schema = z.object({
  status: z.enum(['done', 'error']),
  errorMessage: z.string().optional()
});

export async function POST(request: Request, context: { params: { id: string } }) {
  const apiKey = request.headers.get('x-print-agent-key');
  if (!env.PRINT_AGENT_KEY || apiKey !== env.PRINT_AGENT_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const status = parsed.data.status === 'done' ? 'DONE' : 'ERROR';

  const job = await prisma.printJob.update({
    where: { id: context.params.id },
    data: {
      status,
      errorMessage: parsed.data.errorMessage ?? null
    }
  });

  await prisma.photo.update({
    where: { id: job.photoId },
    data: { printStatus: status }
  });

  return NextResponse.json({ status: job.status });
}
