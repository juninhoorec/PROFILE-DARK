import { Product, Profile, GenerationJob } from '../../types';
import { db } from '../../storage/db';
import { ImageRouter } from './image/image-router';
import { ImagePromptEngine } from './image/image-prompt-engine';
import { ProfileConsistencyEngine } from './image/profile-consistency-engine';
import { VoiceRouter } from './voice/voice-router';
import { SceneGenerationEngine } from './video/scene-generation-engine';
import { FFmpegRenderEngine } from './render/ffmpeg-render-engine';
import { SceneQualityInspector } from './quality/scene-quality-inspector';
import { HardwareDetector } from './hardware/hardware-detector';

export interface StartEngineJobParams {
  title?: string;
  profile: Profile;
  product?: Product;
  customScript?: string;
  targetDurationSeconds?: number;
  isSmokeTest?: boolean;
  resolution?: '720p' | '1080p';
  onProgress?: (progressPercent: number, message: string) => void;
}

export class PDGenerationEngine {
  /**
   * Generates a realistic master character image for a profile.
   */
  static async generateMasterImage(profile: Profile, userCustomPrompt?: string) {
    const promptOutput = ImagePromptEngine.buildPrompt({
      userPrompt: userCustomPrompt || `Retrato mestre cinematográfico de ${profile.name}`,
      profile,
      shotType: 'portrait',
      realismLevel: 'ultra-realista',
      aspectRatio: '9:16',
    });

    const result = await ImageRouter.generate({
      prompt: promptOutput.masterPrompt,
      negativePrompt: promptOutput.negativePrompt,
      aspectRatio: '9:16',
      profileId: profile.id,
    }, 'master_portrait');

    // Update profile avatar and reference pack
    const updatedProfile: Profile = {
      ...profile,
      avatarUrl: result.url,
      references: [
        {
          id: `ref_${Date.now()}`,
          url: result.url,
          type: 'image',
          isMaster: true,
          label: 'Imagem Mestre FLUX.2',
          createdAt: new Date().toISOString(),
        },
        ...(profile.references || []).map((r) => ({ ...r, isMaster: false })),
      ],
      updatedAt: new Date().toISOString(),
    };

    db.saveProfile(updatedProfile);
    return { profile: updatedProfile, imageResult: result };
  }

  /**
   * Executes the full video production pipeline (>= 20 seconds or 3s smoke test).
   */
  static async produceVideo(params: StartEngineJobParams): Promise<GenerationJob> {
    const {
      title,
      profile,
      product,
      customScript,
      targetDurationSeconds = 20,
      isSmokeTest = false,
      resolution = '1080p',
      onProgress,
    } = params;

    const effectiveDuration = isSmokeTest ? 3 : Math.max(20, targetDurationSeconds);
    const script =
      customScript ||
      (product
        ? `Oi minha gente! Eu sou a ${profile.name}. Deixa eu mostrar esse ${product.name} que me surpreendeu de verdade pela qualidade e praticidade no dia a dia. Você aplica com facilidade e o resultado é garantido. Clica no link e confira!`
        : `Oi, eu sou a ${profile.name}! Hoje eu vim compartilhar uma experiência incrível que mudou a minha rotina para melhor. Dica simples, prática e que funciona de verdade. Não deixa de conferir!`);

    const job: GenerationJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title || `${isSmokeTest ? '⚡ Teste 3s' : `Vídeo ${effectiveDuration}s`} — ${profile.name}`,
      profileId: profile.id,
      profileName: profile.name,
      profileAvatarUrl: profile.avatarUrl,
      productId: product?.id,
      productName: product?.name,
      status: 'gerando',
      progress: 5,
      durationSeconds: effectiveDuration,
      resolution,
      aspectRatio: '9:16',
      fps: 30,
      pipeline: [
        { id: 'context', label: 'Contexto', status: 'completed' },
        { id: 'script', label: 'Roteiro & Fala Natural', status: 'in_progress' },
        { id: 'audio', label: 'Síntese de Voz', status: 'pending' },
        { id: 'scene_1', label: 'Cena 1', status: 'pending' },
        { id: 'scene_2', label: 'Cena 2', status: isSmokeTest ? 'skipped' : 'pending' },
        { id: 'scene_3', label: 'Cena 3', status: isSmokeTest ? 'skipped' : 'pending' },
        { id: 'render', label: 'Render & Loudness', status: 'pending' },
        { id: 'quality_check', label: 'Quality Check', status: 'pending' },
      ],
      costCredits: 0,
      isSmokeTest,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveJob(job);

    try {
      // 1. Scene Planning
      onProgress?.(10, 'Planejando cenas e cadência oral...');
      const plan = SceneGenerationEngine.planScenes(
        script,
        profile,
        product,
        effectiveDuration,
        isSmokeTest
      );
      job.pipeline[1].status = 'completed';
      job.pipeline[2].status = 'in_progress';
      job.progress = 20;
      db.saveJob(job);

      // 2. Multi-Scene Execution
      onProgress?.(30, 'Gerando cenas conectadas com consistência facial...');
      const executedScenes = await SceneGenerationEngine.generateScenes(
        plan,
        profile,
        product,
        (sceneNum, total, msg) => {
          const pct = Math.round(30 + (sceneNum / total) * 45);
          onProgress?.(pct, msg);
          const stage = job.pipeline.find((p) => p.id === `scene_${sceneNum}`);
          if (stage) stage.status = 'in_progress';
          job.progress = pct;
          db.saveJob(job);
        }
      );

      job.pipeline[2].status = 'completed';
      job.pipeline[3].status = 'completed';
      if (job.pipeline[4]) job.pipeline[4].status = 'completed';
      if (job.pipeline[5]) job.pipeline[5].status = 'completed';
      job.pipeline[6].status = 'in_progress';
      job.progress = 80;
      db.saveJob(job);

      // 3. FFmpeg Composition & Normalization
      onProgress?.(85, 'Compondo cenas, normalizando áudio e renderizando em 1080p...');
      const validSceneClips = executedScenes.map((s) => s.videoPath).filter(Boolean);

      const renderResult = await FFmpegRenderEngine.renderFinalVideo({
        sceneVideoPaths: validSceneClips,
        targetResolution: resolution,
        targetFps: 30,
        minDurationSeconds: effectiveDuration,
      });

      job.pipeline[6].status = 'completed';
      job.pipeline[7].status = 'in_progress';
      job.progress = 95;
      db.saveJob(job);

      // 4. Quality Inspection
      onProgress?.(95, 'Executando inspeção de qualidade AI...');
      const qc = SceneQualityInspector.inspectScene({
        videoUrl: renderResult.videoUrl,
        expectedCharacterName: profile.name,
        expectedProductName: product?.name,
      });

      job.pipeline[7].status = 'completed';
      job.status = 'concluido';
      job.progress = 100;
      job.videoUrl = renderResult.videoUrl;
      job.thumbnailUrl = profile.avatarUrl;
      job.providerUsed = 'PD Generation Engine (Wan 2.2 + Chatterbox + FFmpeg)';
      job.modelUsed = `Wan 2.2 / 1080x1920 @ 30fps`;
      job.qualityScore = qc.overallScore;
      job.durationSeconds = effectiveDuration;
      job.completedAt = new Date().toISOString();

      db.saveJob(job);
      onProgress?.(100, `Vídeo concluído com sucesso (${effectiveDuration}s)!`);

      return job;
    } catch (err: any) {
      console.error('Falha no PD Generation Engine:', err);
      job.status = 'falhou';
      job.errorMessage = err.message;
      job.userFriendlyError = `Falha na geração: ${err.message}`;
      db.saveJob(job);
      throw err;
    }
  }
}
