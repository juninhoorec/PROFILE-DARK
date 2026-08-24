import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { CreativeDirector } from '@/lib/ai/creative-director';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      profileId,
      productId,
      quantity = 5,
      format = 'reels',
      variations = ['hook', 'cta'],
    } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado.' }, { status: 400 });
    }

    const product = productId ? db.getProductById(productId) : undefined;
    const jobs = [];

    // Creative variation angles
    const angles = [
      'Quebra de Padrão & Curiosidade',
      'Problema Real vs Solução Imediata',
      'Antes & Depois com Prova Visual',
      'Review Sincero & Teste de Resistência',
      'UGC Orgânico & Storytelling Sensorial',
      'Gatilho de Urgência & Oferta Limitada',
    ];

    for (let i = 0; i < quantity; i++) {
      const angle = angles[i % angles.length];
      const plan = CreativeDirector.createPlan({
        profile,
        product,
        prompt: `Variação ${i + 1}: Foco em ${angle}`,
        format,
      });
      plan.creativeAngle = angle;
      plan.hook = `[Variação #${i + 1}] ${plan.hook}`;

      const job = await AIOrchestrator.startJob({
        title: `${profile.name} — Criativo #${String(i + 1).padStart(2, '0')} (${angle})`,
        profile,
        product,
        creativePlan: plan,
        resolution: '1080p',
        fps: 30,
        isSmokeTest: false,
      });
      jobs.push(job);
    }

    return NextResponse.json({
      message: `${quantity} vídeos em massa adicionados à fila de renderização com sucesso!`,
      jobs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
