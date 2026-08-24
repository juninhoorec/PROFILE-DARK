import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { CreativeDirector } from '@/lib/ai/creative-director';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, productId, prompt, objective, funnelStage, format, targetDuration } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Nenhum profile selecionado ou cadastrado.' }, { status: 400 });
    }

    const product = productId ? db.getProductById(productId) : undefined;

    const plan = CreativeDirector.createPlan({
      profile,
      product,
      prompt: prompt || 'Vídeo de alta conversão para redes sociais',
      objective,
      funnelStage,
      format,
      targetDuration,
    });

    return NextResponse.json({ creativePlan: plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
