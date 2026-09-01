import { NextResponse } from 'next/server';
import { resumeProductVideoJob } from '@/lib/ai/product-video-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = await resumeProductVideoJob(params.id);
  return job ? NextResponse.json({ job }) : NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
}
