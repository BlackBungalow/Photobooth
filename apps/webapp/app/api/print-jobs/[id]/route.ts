import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, context: { params: { id: string } }) {
  const job = await prisma.printJob.findUnique({
    where: { id: context.params.id }
  });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    errorMessage: job.errorMessage
  });
}
