import { db } from '../storage/db';
import { SmartProviderRouter } from './router/smart-provider-router';
import { PDGenerationEngine } from './engine/pd-generation-engine';
import { GenerationJob, CreativePlan, Profile, Product } from '../types';

export class AIOrchestrator {
  // Start full generation job
  static async startJob(params: {
    title: string;
    profile: Profile;
    product?: Product;
    creativePlan: CreativePlan;
    resolution?: '720p' | '1080p' | '1440p' | '4k';
    fps?: 24 | 30 | 60;
    isSmokeTest?: boolean;
  }): Promise<GenerationJob> {
    const {
      title,
      profile,
      product,
      creativePlan,
      resolution = '1080p',
      fps = 30,
      isSmokeTest = false,
    } = params;

    const duration = isSmokeTest ? 3 : Math.max(20, creativePlan.targetDurationSeconds || 20);
    const freeOnly = process.env.FREE_ONLY_MODE !== 'false';
    const cost = freeOnly ? 0 : isSmokeTest ? 15 : Math.round(duration * 3.5);

    // Reserve credits
    const reserved = freeOnly || db.reserveCredits(
      cost,
      `Geração de vídeo (${isSmokeTest ? 'Teste rápido 3s' : `${duration}s - ${resolution}`}) para ${profile.name}`,
    );

    if (!reserved) {
      throw new Error('Limite interno indisponível.');
    }

    // Try PDGenerationEngine first (Local multi-scene pipeline >= 20s)
    try {
      const job = await PDGenerationEngine.produceVideo({
        title,
        profile,
        product,
        customScript: creativePlan.fullScript,
        targetDurationSeconds: duration,
        isSmokeTest,
        resolution: resolution === '1080p' ? '1080p' : '720p',
      });
      return job;
    } catch (engineErr) {
      console.warn('PDGenerationEngine fallback to router:', engineErr);
    }

    // Fallback to SmartProviderRouter
    const job: GenerationJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      profileId: profile.id,
      profileName: profile.name,
      profileAvatarUrl: profile.avatarUrl,
      productId: product?.id,
      productName: product?.name,
      creativePlanId: creativePlan.id,
      creativePlan,
      status: 'gerando',
      progress: 15,
      durationSeconds: duration,
      resolution,
      aspectRatio: '9:16',
      fps,
      pipeline: [
        { id: 'context', label: 'Contexto', status: 'completed' },
        { id: 'script', label: 'Roteiro', status: 'completed' },
        { id: 'audio', label: 'Áudio', status: 'completed' },
        { id: 'scene_1', label: 'Cena 1', status: 'completed' },
        { id: 'scene_2', label: 'Cena 2', status: isSmokeTest ? 'completed' : 'in_progress' },
        { id: 'scene_3', label: 'Cena 3', status: isSmokeTest ? 'completed' : 'pending' },
        { id: 'render', label: 'Render', status: 'in_progress' },
        { id: 'quality_check', label: 'Quality Check', status: 'pending' },
      ],
      costCredits: cost,
      isSmokeTest,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveJob(job);

    const videoRes = await SmartProviderRouter.generateVideo({
      prompt: creativePlan.fullScript,
      imageUrl: profile.avatarUrl,
      durationSeconds: duration,
      isSmokeTest,
    });

    if (videoRes.success && videoRes.data) {
      job.videoUrl = videoRes.data.videoUrl;
      job.thumbnailUrl = videoRes.data.thumbnailUrl;
      job.durationSeconds = videoRes.data.actualDurationSeconds || duration;
      job.status = 'concluido';
      job.progress = 100;
      job.providerUsed = `${videoRes.provider} / ${videoRes.model}`;
      job.completedAt = new Date().toISOString();
      job.pipeline.forEach((p) => (p.status = 'completed'));
      db.saveJob(job);
    } else {
      job.status = 'falhou';
      job.errorMessage = videoRes.error;
      job.userFriendlyError = videoRes.userFriendlyError;
      db.refundCredits(cost, `Reembolso por falha na geração do job ${job.id}`, job.id);
      db.saveJob(job);
    }

    return job;
  }

  // Short 3-second smoke test
  static async run3SecondTest(profile: Profile, product?: Product): Promise<GenerationJob> {
    const testPlan: CreativePlan = {
      id: `test_plan_${Date.now()}`,
      profileId: profile.id,
      productId: product?.id,
      format: 'reels',
      objective: 'conversao',
      funnelStage: 'meio',
      targetDurationSeconds: 3,
      hook: `Teste rápido de 3 segundos para ${profile.name}`,
      creativeAngle: 'Smoke Test de Validação de Identidade e Produto',
      fullScript: `[CENA 1 - 3 SEGUNDOS]\n${profile.name} olha para a câmera com movimento suave e sorriso autêntico segurando ${product ? product.name : 'produto de referência'}.`,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Cena 1: Teste Rápido de 3 Segundos',
          durationSeconds: 3,
          visualPrompt: `Close-up ultrarrealista de ${profile.name} com iluminação 4K e textura de pele natural.`,
          cameraMovement: 'Zoom-in lento estabilizado.',
          lightingStyle: 'Golden hour suave.',
          narrationScript: 'Qualidade confirmada com fidelidade de personagem.',
          productInteraction: product ? `Exibindo ${product.name}.` : 'Gesto natural.',
          characterAction: 'Olhar para câmera.',
          status: 'completed',
        },
      ],
      ctaText: 'Aprovar e gerar vídeo completo',
      captionText: 'Teste rápido de validação do pipeline.',
      hashtags: ['#SmokeTest', '#ProfileDark'],
      thumbnailPrompt: `Thumbnail de validação rápida para ${profile.name}`,
      thumbnailUrl: profile.avatarUrl,
      estimatedCredits: 0,
      createdAt: new Date().toISOString(),
    };

    return this.startJob({
      title: `⚡ Teste rápido 3s — ${profile.name} ${product ? `(${product.name})` : ''}`,
      profile,
      product,
      creativePlan: testPlan,
      resolution: '1080p',
      fps: 30,
      isSmokeTest: true,
    });
  }

  // Scene-level partial retry
  static async retryScene(jobId: string, sceneNumber: number): Promise<GenerationJob> {
    const job = db.getJobById(jobId);
    if (!job) throw new Error('Job não encontrado');

    const sceneStage = job.pipeline.find((p) => p.id === `scene_${sceneNumber}`);
    if (sceneStage) {
      sceneStage.status = 'in_progress';
    }

    job.status = 'gerando';
    job.progress = Math.min(85, job.progress);
    db.saveJob(job);

    const result = await SmartProviderRouter.generateVideo({
      prompt: job.creativePlan?.fullScript || `Regenerar cena ${sceneNumber} de ${job.title}`,
      imageUrl: job.profileAvatarUrl,
      durationSeconds: job.durationSeconds,
      aspectRatio: job.aspectRatio,
    });

    if (result.success && result.data) {
      if (sceneStage) sceneStage.status = 'completed';
      job.status = 'concluido';
      job.progress = 100;
      job.videoUrl = result.data.videoUrl;
      job.thumbnailUrl = result.data.thumbnailUrl;
      job.providerUsed = `${result.provider} / ${result.model}`;
      job.completedAt = new Date().toISOString();
      job.pipeline.forEach((stage) => (stage.status = 'completed'));
    } else {
      if (sceneStage) sceneStage.status = 'failed';
      job.status = 'falhou';
      job.errorMessage = result.error;
      job.userFriendlyError = result.userFriendlyError;
    }
    db.saveJob(job);

    return job;
  }
}
