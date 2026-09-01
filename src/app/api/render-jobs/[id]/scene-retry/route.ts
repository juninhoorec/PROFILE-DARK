import { NextResponse } from 'next/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY || process.env.KLING_API_KEY)) {
    return NextResponse.json({ error: 'Configure um provider de vídeo real antes de regenerar uma cena.' }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const sceneNumber = body.sceneNumber || 2;
    const updatedJob = await AIOrchestrator.retryScene(params.id, sceneNumber);
    return NextResponse.json({ job: updatedJob });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
