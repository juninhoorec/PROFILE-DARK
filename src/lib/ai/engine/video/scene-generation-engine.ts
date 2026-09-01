import fs from 'node:fs/promises';
import path from 'node:path';
import { Product, Profile } from '../../../types';
import { NaturalSpeechEngine } from '../voice/natural-speech-engine';
import { VoiceRouter } from '../voice/voice-router';
import { ContinuityEngine } from './continuity-engine';
import { VideoRouter, VideoSceneType } from './video-router';
import { LatentSyncProvider, latentSyncProvider } from '../../providers/latentsync-provider';
import { newUploadPath } from '../../../local-media';

export interface PlannedScene {
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  sceneType: VideoSceneType;
  narrationText: string;
  motionPrompt: string;
  isTalkingHead: boolean;
}

export interface SceneExecutionResult {
  sceneNumber: number;
  videoPath: string;
  videoUrl: string;
  audioPath: string;
  audioUrl: string;
  durationSeconds: number;
  lastFramePath?: string;
}

export interface VideoPlanOutput {
  title: string;
  requestedDurationSeconds: number;
  totalPlannedDurationSeconds: number;
  masterScript: string;
  scenes: PlannedScene[];
}

export class SceneGenerationEngine {
  /**
   * Plans the scenes ensuring the strict >= 20 seconds rule for final videos.
   */
  static planScenes(
    script: string,
    profile: Profile,
    product?: Product,
    targetDurationSeconds: number = 20,
    isSmokeTest: boolean = false
  ): VideoPlanOutput {
    // Hard rule: Minimum 20s for final videos (Spec 49)
    const effectiveDuration = isSmokeTest ? 3 : Math.max(20, targetDurationSeconds);
    const { spokenText, estimatedDurationSec, segments } = NaturalSpeechEngine.optimizeForSpeech(script);

    if (isSmokeTest) {
      return {
        title: `⚡ Teste Rápido 3s — ${profile.name}`,
        requestedDurationSeconds: 3,
        totalPlannedDurationSeconds: 3,
        masterScript: spokenText,
        scenes: [
          {
            sceneNumber: 1,
            title: 'Validação Rápida de Identidade e Fala',
            durationSeconds: 3,
            sceneType: 'character_talking',
            narrationText: segments[0] || spokenText.slice(0, 60),
            motionPrompt: `Natural eye contact and warm subtle smile by ${profile.name}, realistic facial motion and gentle head nodding.`,
            isTalkingHead: true,
          },
        ],
      };
    }

    // Determine number of scenes (4 or 5 scenes for 20-30s, up to 7 for 45-60s)
    const sceneCount = effectiveDuration >= 45 ? 6 : 5;
    const defaultSceneDuration = Math.round((effectiveDuration / sceneCount) * 10) / 10;

    const plannedScenes: PlannedScene[] = [];

    // Scene 1: Hook / Intro (Character talking in environment)
    plannedScenes.push({
      sceneNumber: 1,
      title: 'Abertura & Gancho Inicial',
      durationSeconds: defaultSceneDuration,
      sceneType: 'character_talking',
      narrationText: segments[0] || `Oi gente! Eu sou a ${profile.name} e hoje eu quero mostrar uma novidade incrível.`,
      motionPrompt: `${profile.name} olhando para a câmera com expressão acolhedora em sua cozinha, falando naturalmente com pequenos gestos com as mãos.`,
      isTalkingHead: true,
    });

    // Scene 2: Product presentation / Problem context
    plannedScenes.push({
      sceneNumber: 2,
      title: product ? 'Apresentação do Produto' : 'Contexto e Descoberta',
      durationSeconds: defaultSceneDuration,
      sceneType: product ? 'product_closeup' : 'character_movement',
      narrationText: segments[1] || (product ? `Olha esse ${product.name}. A praticidade disso no dia a dia é surreal.` : 'Eu testei isso durante a semana inteira e o resultado me surpreendeu.'),
      motionPrompt: product
        ? `Close-up detalhado do produto ${product.name} sendo segurado com cuidado, iluminação elegante destacando a embalagem e rótulo.`
        : `${profile.name} demonstrando a aplicação com movimentos suaves e foco nos detalhes.`,
      isTalkingHead: false,
    });

    // Scene 3: Practical usage / Demonstration
    plannedScenes.push({
      sceneNumber: 3,
      title: 'Demonstração de Uso & Prova Prática',
      durationSeconds: defaultSceneDuration,
      sceneType: 'character_movement',
      narrationText: segments[2] || (product ? `A textura e a eficiência funcionam direto no primeiro uso, sem segredo nenhum.` : 'É só aplicar do jeito certo e você já percebe a diferença imediata.'),
      motionPrompt: `${profile.name} em ação aplicando e testando com expressão de satisfação e confiança, enquadramento cinematográfico.`,
      isTalkingHead: false,
    });

    // Scene 4: Result / Reaction
    plannedScenes.push({
      sceneNumber: 4,
      title: 'Resultado Real & Reação Genuína',
      durationSeconds: defaultSceneDuration,
      sceneType: 'character_talking',
      narrationText: segments[3] || 'Fica perfeito, limpo e super aprovado. Economiza tempo e resolve de verdade.',
      motionPrompt: `${profile.name} sorrindo calorosamente para a câmera, gesticulando com aprovação sincera.`,
      isTalkingHead: true,
    });

    // Scene 5: Call to Action (CTA)
    if (sceneCount >= 5) {
      plannedScenes.push({
        sceneNumber: 5,
        title: 'Chamada para Ação (CTA)',
        durationSeconds: defaultSceneDuration,
        sceneType: 'character_talking',
        narrationText: segments[4] || (profile.dna?.mainCTA || 'Clica no link aqui embaixo para conferir e garantir o seu!'),
        motionPrompt: `${profile.name} apontando sutilmente para baixo convidando a audiência com sorriso acolhedor.`,
        isTalkingHead: true,
      });
    }

    const totalPlanned = plannedScenes.reduce((sum, s) => sum + s.durationSeconds, 0);

    return {
      title: `Produção 20s+ — ${profile.name} ${product ? `(${product.name})` : ''}`,
      requestedDurationSeconds: effectiveDuration,
      totalPlannedDurationSeconds: totalPlanned,
      masterScript: spokenText,
      scenes: plannedScenes,
    };
  }

  /**
   * Executes the multi-scene generation pipeline with Audio-First and Last-Frame continuity.
   */
  static async generateScenes(
    plan: VideoPlanOutput,
    profile: Profile,
    product?: Product,
    onProgress?: (sceneNumber: number, totalScenes: number, message: string) => void
  ): Promise<SceneExecutionResult[]> {
    const executedScenes: SceneExecutionResult[] = [];
    const workDir = path.join(process.cwd(), 'data', 'scene-workspace', `job_${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    let currentReferenceImage = profile.avatarUrl;

    for (let i = 0; i < plan.scenes.length; i++) {
      const scene = plan.scenes[i];
      const sceneIdx = i + 1;
      const totalScenes = plan.scenes.length;

      onProgress?.(sceneIdx, totalScenes, `Gerando voz e movimento da cena ${sceneIdx} de ${totalScenes}: ${scene.title}`);

      // 1. Generate narration audio for this specific scene
      const sceneAudio = await VoiceRouter.generate({
        text: scene.narrationText,
        voiceName: profile.voiceName || 'Microsoft Maria Desktop',
        language: 'pt-BR',
        profileId: profile.id,
      });

      // 2. Generate video clip for this scene
      const sceneVideo = await VideoRouter.generate(
        {
          prompt: scene.motionPrompt,
          imageUrl: currentReferenceImage,
          audioUrl: sceneAudio.audioUrl,
          durationSeconds: scene.durationSeconds,
          aspectRatio: '9:16',
          fps: 30,
          profileId: profile.id,
          productId: product?.id,
        },
        scene.sceneType
      );

      // 3. Apply Lip-Sync if this is a talking scene
      let finalSceneVideoUrl = sceneVideo.videoUrl;
      let finalSceneVideoPath = sceneVideo.localPath || path.join(workDir, `scene_${sceneIdx}.mp4`);

      if (scene.isTalkingHead && sceneAudio.localPath) {
        onProgress?.(sceneIdx, totalScenes, `Aplicando sincronização labial na cena ${sceneIdx}`);
        const lipSyncOutput = path.join(workDir, `scene_${sceneIdx}_lipsync.mp4`);
        const lipResult = await latentSyncProvider.syncLips({
          videoUrl: finalSceneVideoPath,
          audioUrl: sceneAudio.localPath,
          outputPath: lipSyncOutput,
        });
        if (lipResult.localPath) {
          finalSceneVideoPath = lipResult.localPath;
        }
      }

      // 4. Extract last frame for continuity if not last scene
      let nextRefPath: string | undefined;
      if (sceneIdx < totalScenes && finalSceneVideoPath) {
        nextRefPath = path.join(workDir, `last_frame_scene_${sceneIdx}.jpg`);
        try {
          await ContinuityEngine.extractLastFrame(finalSceneVideoPath, nextRefPath);
          currentReferenceImage = nextRefPath;
        } catch (frameErr) {
          console.warn(`Could not extract last frame for scene ${sceneIdx}:`, frameErr);
        }
      }

      executedScenes.push({
        sceneNumber: sceneIdx,
        videoPath: finalSceneVideoPath,
        videoUrl: finalSceneVideoUrl,
        audioPath: sceneAudio.localPath || '',
        audioUrl: sceneAudio.audioUrl,
        durationSeconds: scene.durationSeconds,
        lastFramePath: nextRefPath,
      });
    }

    return executedScenes;
  }
}
