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

    if(updatedJob.status==='falhou')return NextResponse.json({error:updatedJob.userFriendlyError||'A regeneração real não foi concluída.',job:updatedJob},{status:503});
    return NextResponse.json({message:`Cena ${sceneNumber} regenerada pelo provider real configurado. Revise o novo vídeo antes de aprovar.`,job:updatedJob});
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
