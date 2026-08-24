import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { AIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, profileId, productId, creativePlan, resolution, fps } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Nenhum profile selecionado.' }, { status: 400 });
    }

    const product = productId ? db.getProductById(productId) : undefined;

    if (!creativePlan) {
      return NextResponse.json({ error: 'Plano criativo é obrigatório para renderização.' }, { status: 400 });
    }

    const job = await AIOrchestrator.startJob({
      title: title || `${creativePlan.hook.slice(0, 35)}...`,
      profile,
      product,
      creativePlan,
      resolution: resolution || '1080p',
      fps: fps || 30,
      isSmokeTest: false,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
