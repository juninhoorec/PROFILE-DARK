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
    const qualityCheck = db.getQualityCheckByJobId(job.id);

    return NextResponse.json({
      job,
      qualityCheck,
      message: 'Teste de 3 segundos executado com sucesso.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
