import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAndStartProductVideoJob } from '@/lib/ai/product-video-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = z.object({ profileId: z.string(), productId: z.string(), resolution: z.enum(['480p', '720p']).default('480p') });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const job = await createAndStartProductVideoJob(input.profileId, input.productId, input.resolution);
    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível iniciar o vídeo.' }, { status: 400 });
  }
}

