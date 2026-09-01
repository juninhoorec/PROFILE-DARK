import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { AIOrchestrator } from '@/lib/ai/orchestrator';
import { CreativePlan } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      profileId,
      productId,
      creativePlan,
      prompt,
      targetDurationSeconds = 20,
      resolution = '1080p',
      fps = 30,
    } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Nenhum profile selecionado.' }, { status: 400 });
    }

    const product = productId ? db.getProductById(productId) : undefined;

    let plan: CreativePlan = creativePlan;
    if (!plan) {
      const script = prompt || `Vídeo promocional de alta conversão para ${profile.name}`;
      plan = {
        id: `plan_${Date.now()}`,
        profileId: profile.id,
        productId: product?.id,
        format: 'reels',
        objective: 'conversao',
        funnelStage: 'meio',
        targetDurationSeconds: Math.max(20, targetDurationSeconds),
        hook: `Dica de ouro com ${profile.name}`,
        creativeAngle: 'Apresentação comercial autêntica',
        fullScript: script,
        scenes: [
          {
            sceneNumber: 1,
            title: 'Abertura & Gancho',
            durationSeconds: Math.round(targetDurationSeconds / 4),
            visualPrompt: `Close-up ultrarrealista de ${profile.name} falando com a câmera`,
            cameraMovement: 'Zoom sutil',
            lightingStyle: 'Estúdio suave',
            narrationScript: script.slice(0, 80),
            productInteraction: product ? `Exibindo ${product.name}` : 'Gesto natural',
            characterAction: 'Falar com a câmera',
            status: 'pending',
          },
        ],
        ctaText: profile.dna?.mainCTA || 'Clique no link para saber mais!',
        captionText: 'Vídeo gerado automaticamente.',
        hashtags: ['#ProfileDark', `#${profile.name.replace(/\s+/g, '')}`],
        thumbnailPrompt: `Thumbnail para ${profile.name}`,
        thumbnailUrl: profile.avatarUrl,
        estimatedCredits: 0,
        createdAt: new Date().toISOString(),
      };
    }

    const job = await AIOrchestrator.startJob({
      title: title || `${plan.hook.slice(0, 35)}...`,
      profile,
      product,
      creativePlan: plan,
      resolution: resolution || '1080p',
      fps: fps || 30,
      isSmokeTest: false,
    });

    if (job.status === 'falhou') {
      return NextResponse.json({ error: job.userFriendlyError || 'O render não pôde ser iniciado.', jobId: job.id }, { status: 503 });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
