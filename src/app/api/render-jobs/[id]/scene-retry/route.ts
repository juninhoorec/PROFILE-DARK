import { NextResponse } from 'next/server';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const sceneNumber = body.sceneNumber || 2;
    const updatedJob = await AIOrchestrator.retryScene(params.id, sceneNumber);
    return NextResponse.json({ job: updatedJob });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
