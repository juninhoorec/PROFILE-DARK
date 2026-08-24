import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, sceneNumber = 2 } = body;

    const job = db.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job não encontrado.' }, { status: 404 });
    }

    const updatedJob = await AIOrchestrator.retryScene(jobId, sceneNumber);

    return NextResponse.json({
      message: `Correção automática da Cena ${sceneNumber} iniciada mantendo Profile e Produto bloqueados.`,
      job: updatedJob,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
