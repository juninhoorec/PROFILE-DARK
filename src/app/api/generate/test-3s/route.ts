import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, productId } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Nenhum profile encontrado para o teste.' }, { status: 400 });
    }

    const product = productId ? db.getProductById(productId) : undefined;

    const job = await AIOrchestrator.run3SecondTest(profile, product);
    if (job.status === 'falhou') {
      return NextResponse.json({ error: job.userFriendlyError || 'O teste de vídeo falhou.', jobId: job.id }, { status: 503 });
    }
    const qualityCheck = db.getQualityCheckByJobId(job.id);

    return NextResponse.json({
      job,
      qualityCheck,
      message: `Teste rápido de ${job.durationSeconds} segundos executado com sucesso.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
