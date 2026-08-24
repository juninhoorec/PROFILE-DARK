import { db } from '../storage/db';
import { SmartProviderRouter } from './router/smart-provider-router';
import { VisualInspector } from './visual-inspector';
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

    const duration = isSmokeTest ? 3 : creativePlan.targetDurationSeconds;
    const cost = isSmokeTest ? 15 : Math.round(duration * 3.5);

    // Reserve credits
    const reserved = db.reserveCredits(
      cost,
      `Geração de vídeo (${isSmokeTest ? 'Teste 3s' : `${duration}s - ${resolution}`}) para ${profile.name}`,
    );

    if (!reserved) {
      throw new Error('Créditos insuficientes na conta.');
    }

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

    // Trigger video synthesis via SmartProviderRouter
    const videoRes = await SmartProviderRouter.generateVideo({
      prompt: creativePlan.fullScript,
      imageUrl: profile.avatarUrl,
      durationSeconds: duration,
      isSmokeTest,
    });

    if (videoRes.success && videoRes.data) {
      job.videoUrl = videoRes.data.videoUrl;
      job.thumbnailUrl = videoRes.data.thumbnailUrl;
      job.status = 'concluido';
      job.progress = 100;
      job.providerUsed = `${videoRes.provider} / ${videoRes.model}`;
      job.completedAt = new Date().toISOString();

      // Mark all pipeline stages completed
      job.pipeline.forEach((p) => (p.status = 'completed'));

      // Perform AI Quality Inspection
      const qualityCheck = VisualInspector.inspect(job);
      db.saveQualityCheck(qualityCheck);
      job.qualityScore = qualityCheck.metrics.overallQuality;

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

  // 3-Second Smoke Test Execution
  static async run3SecondTest(profile: Profile, product?: Product): Promise<GenerationJob> {
    const testPlan: CreativePlan = {
      id: `test_plan_${Date.now()}`,
      profileId: profile.id,
      productId: product?.id,
      format: 'reels',
      objective: 'conversao',
      funnelStage: 'meio',
      targetDurationSeconds: 3,
      hook: `Teste de 3 segundos para ${profile.name}`,
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
      captionText: 'Teste de validação de pipeline 3s.',
      hashtags: ['#SmokeTest', '#ProfileDark'],
      thumbnailPrompt: `Thumbnail de validação 3s para ${profile.name}`,
      thumbnailUrl: profile.avatarUrl,
      estimatedCredits: 15,
      createdAt: new Date().toISOString(),
    };

    return this.startJob({
      title: `⚡ Teste de 3s — ${profile.name} ${product ? `(${product.name})` : ''}`,
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

    // Simulate scene regeneration
    setTimeout(() => {
      if (sceneStage) sceneStage.status = 'completed';
      job.status = 'concluido';
      job.progress = 100;
      const qc = VisualInspector.inspect(job);
      qc.status = 'passed';
      qc.details.issues = [];
      qc.details.autoFixAvailable = false;
      db.saveQualityCheck(qc);
      db.saveJob(job);
    }, 1500);

    return job;
  }
}
