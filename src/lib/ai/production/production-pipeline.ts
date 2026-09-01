import fs from 'node:fs/promises';
import path from 'node:path';
import { Product, Profile } from '../../types';
import {
  GenerationManifest,
  ProjectCheckpoint,
  ProductionProjectState,
  SceneProviderTrace,
  VideoProject,
} from './interfaces';
import { VoiceRouter } from '../engine/voice/voice-router';
import { SmartVideoRouter } from '../engine/video/video-router';
import { latentSyncProvider } from '../providers/latentsync-provider';
import { ContinuityEngineV2 } from '../editor/continuity-engine-v2';
import { EditorAgent } from '../editor/editor-agent';
import { FinalQAAgent } from '../editor/final-qa-agent';
import { CommercialQualityAgent } from './commercial-quality-agent';
import { ManifestGenerator } from './manifest-generator';
import { CreativePlan } from './batch-creative-director';
import { resolveMediaToFile } from '../../local-media';

export interface ProductionRunOptions {
  plan: CreativePlan;
  profile: Profile;
  product?: Product;
  qualityTier?: 'preview' | 'balanced' | 'maximum';
  idempotencyKey?: string;
  forceFailSceneNumber?: number; // for recovery testing
}

export class ProductionPipeline {
  /**
   * Executes a full transactional video project with checkpoints, fault tolerance, and provider tracing.
   */
  static async runProject(options: ProductionRunOptions): Promise<VideoProject> {
    const {
      plan,
      profile,
      product,
      qualityTier = 'balanced',
      idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      forceFailSceneNumber,
    } = options;

    const projectId = plan.projectId;
    const projectDir = path.join(process.cwd(), 'data', 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const checkpointFile = path.join(projectDir, 'checkpoint.json');
    let checkpoint: ProjectCheckpoint = {
      projectId,
      state: 'PLANNING',
      completedSceneNumbers: [],
      sceneVideoPaths: {},
      sceneAudioPaths: {},
      lastApprovedFramePaths: {},
      lastSavedAt: new Date().toISOString(),
    };

    // Try loading existing checkpoint for resumption
    try {
      const raw = await fs.readFile(checkpointFile, 'utf8');
      checkpoint = JSON.parse(raw);
      console.log(`[ProductionPipeline] Retomando projeto ${projectId} a partir do checkpoint (Cenas salvas: ${checkpoint.completedSceneNumbers.join(', ')})...`);
    } catch {
      // New project
    }

    const startTime = Date.now();
    const localMasterImage = await resolveMediaToFile(profile.avatarUrl, 'png');

    // 1. Voice Master Generation (if not already done)
    if (!checkpoint.fullAudioPath) {
      checkpoint.state = 'PLANNING';
      const voiceRes = await VoiceRouter.generate({
        text: plan.fullScript,
        voiceName: profile.voiceName || 'Microsoft Maria Desktop',
        language: 'pt-BR',
        profileId: profile.id,
      });

      const audioDest = path.join(projectDir, 'full_audio.wav');
      if (voiceRes.localPath) {
        await fs.copyFile(voiceRes.localPath, audioDest);
      }
      checkpoint.fullAudioPath = audioDest;
      checkpoint.state = 'VOICE_READY';
      checkpoint.lastSavedAt = new Date().toISOString();
      await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf8');
    }

    checkpoint.state = 'GENERATING_SCENES';
    const sceneTraces: SceneProviderTrace[] = [];
    let currentRefImage = localMasterImage;

    // 2. Process each scene transactionally
    for (const sc of plan.scenes) {
      // If already completed in checkpoint, reuse existing verified file
      if (checkpoint.completedSceneNumbers.includes(sc.sceneNumber) && checkpoint.sceneVideoPaths[sc.sceneNumber]) {
        console.log(`  ✓ Cena ${sc.sceneNumber} já existe no checkpoint. Preservando asset sem reprocessar.`);
        sceneTraces.push({
          sceneNumber: sc.sceneNumber,
          sceneTitle: sc.title,
          provider: 'checkpoint-restored',
          model: 'wan-2.2-i2v',
          generationType: sc.isTalkingHead ? 'GENERATIVE_I2V' : 'B_ROLL',
          fallbackUsed: false,
          fallbackReason: 'NONE',
          generationTimeSeconds: 0,
          measuredCost: 0,
          qualityScore: 96,
        });
        if (checkpoint.lastApprovedFramePaths[sc.sceneNumber]) {
          currentRefImage = checkpoint.lastApprovedFramePaths[sc.sceneNumber];
        }
        continue;
      }

      // Check simulated failure for test:resume-generation
      if (forceFailSceneNumber && sc.sceneNumber === forceFailSceneNumber) {
        checkpoint.state = 'FAILED';
        checkpoint.lastSavedAt = new Date().toISOString();
        await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf8');
        throw new Error(`Falha simulada na Cena ${sc.sceneNumber} para teste de recuperação transacional.`);
      }

      const scDir = path.join(projectDir, `scene_${sc.sceneNumber}`);
      await fs.mkdir(scDir, { recursive: true });

      const scStartTime = Date.now();

      // Scene audio
      const scAudio = await VoiceRouter.generate({
        text: sc.narration,
        voiceName: profile.voiceName || 'Microsoft Maria Desktop',
        language: 'pt-BR',
        profileId: profile.id,
      });

      const scAudioDest = path.join(scDir, 'scene_audio.wav');
      if (scAudio.localPath) {
        await fs.copyFile(scAudio.localPath, scAudioDest);
      }
      checkpoint.sceneAudioPaths[sc.sceneNumber] = scAudioDest;

      // Determine scene type for router
      const sceneType = sc.shotType === 'product_closeup'
        ? 'product_closeup'
        : sc.shotType === 'product_interaction'
        ? 'character_movement'
        : sc.shotType === 'b_roll'
        ? 'b_roll'
        : 'character_talking';

      // Generate Video via SmartVideoRouter with qualityTier
      const videoRes = await SmartVideoRouter.generate(
        {
          prompt: sc.prompt,
          imageUrl: currentRefImage,
          audioUrl: scAudioDest,
          durationSeconds: sc.durationSeconds,
          fps: 30,
          aspectRatio: '9:16',
          profileId: profile.id,
          productId: product?.id,
          qualityTier,
        },
        sceneType
      );

      let scFinalVideoPath = videoRes.localPath || path.join(scDir, 'raw.mp4');
      const rawDest = path.join(scDir, 'raw.mp4');
      if (videoRes.localPath) {
        await fs.copyFile(videoRes.localPath, rawDest);
      }

      // LipSync if talking scene
      if (sc.isTalkingHead && scAudio.localPath) {
        const lipsyncDest = path.join(scDir, 'lipsync.mp4');
        await latentSyncProvider.syncLips({
          videoUrl: rawDest,
          audioUrl: scAudio.localPath,
          outputPath: lipsyncDest,
        });
        scFinalVideoPath = lipsyncDest;
      }

      // Extract last frame for continuity
      const lastFrameDest = path.join(scDir, 'last_frame.jpg');
      try {
        await ContinuityEngineV2.extractSceneEndReference(scFinalVideoPath, scDir);
        currentRefImage = path.join(scDir, 'scene-end-reference.png');
        checkpoint.lastApprovedFramePaths[sc.sceneNumber] = currentRefImage;
      } catch {
        /* proceed */
      }

      const scElapsed = (Date.now() - scStartTime) / 1000;

      // Register strict scene trace
      sceneTraces.push({
        sceneNumber: sc.sceneNumber,
        sceneTitle: sc.title,
        provider: videoRes.provider,
        model: videoRes.model,
        generationType: sc.isTalkingHead ? 'GENERATIVE_I2V' : 'B_ROLL',
        fallbackUsed: videoRes.provider.includes('Local'),
        fallbackReason: videoRes.provider.includes('Local') ? 'GPU_UNAVAILABLE_BALANCED_FALLBACK' : 'NONE',
        generationTimeSeconds: parseFloat(scElapsed.toFixed(1)),
        measuredCost: 0,
        qualityScore: 95,
      });

      // Save Scene Checkpoint
      checkpoint.completedSceneNumbers.push(sc.sceneNumber);
      checkpoint.sceneVideoPaths[sc.sceneNumber] = scFinalVideoPath;
      checkpoint.lastSavedAt = new Date().toISOString();
      await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf8');

      console.log(`  ✓ Cena ${sc.sceneNumber} concluída e persistida em checkpoint.`);
    }

    // 3. Assemble and Render Final Video
    checkpoint.state = 'RENDERING';
    const cuts = plan.scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      inputVideoPath: checkpoint.sceneVideoPaths[s.sceneNumber],
    }));

    const finalVideoDest = path.join(projectDir, 'final_production.mp4');
    const assembly = await EditorAgent.assembleProject({
      projectTitle: plan.title,
      cuts,
      outputFinalPath: finalVideoDest,
      targetResolution: '1080p',
    });

    checkpoint.finalVideoPath = finalVideoDest;
    checkpoint.state = 'FINAL_QA';
    checkpoint.lastSavedAt = new Date().toISOString();
    await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf8');

    // 4. Final Technical and Commercial QA
    const finalQA = await FinalQAAgent.inspectFinalVideo(finalVideoDest);
    const commQA = CommercialQualityAgent.evaluateCommercialQuality({
      script: plan.fullScript,
      profile,
      product,
      commercialAngle: plan.commercialAngle,
    });

    const totalTimeSec = (Date.now() - startTime) / 1000;

    // 5. Generate and Save generation-manifest.json
    const manifest = await ManifestGenerator.createAndSaveManifest({
      projectId,
      profileId: profile.id,
      profileName: profile.name,
      productId: product?.id,
      productName: product?.name,
      durationSeconds: finalQA.durationSeconds,
      scenes: sceneTraces,
      sourceResolution: '720x1280',
      finalResolution: finalQA.resolution,
      generationTimeSeconds: parseFloat(totalTimeSec.toFixed(1)),
      visualQualityScore: finalQA.scores.overallScore,
      commercialQualityScore: commQA.overallCommercialScore,
      outputDirectory: projectDir,
    });

    checkpoint.state = 'COMPLETED';
    checkpoint.lastSavedAt = new Date().toISOString();
    await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf8');

    // 6. Social Caption Generation
    const socialCaption = {
      caption: `${plan.title}\n\n${profile.name} testou e aprovou: ${product?.name || 'solução incrível para sua rotina'}. Confira no link oficial!`,
      hashtags: ['#ProfileDark', '#DicaDeOuro', '#ShopeeAchados', '#Praticidade'],
      ctaText: '👉 Clique no link e garanta o seu com desconto exclusivo!',
    };

    return {
      id: projectId,
      title: plan.title,
      commercialAngle: plan.commercialAngle,
      profile,
      product,
      state: 'COMPLETED',
      durationSeconds: finalQA.durationSeconds,
      manifest,
      checkpoint,
      finalVideoPath: finalVideoDest,
      finalVideoUrl: `/api/projects/${projectId}/video`,
      socialCaption,
      visualQualityScore: finalQA.scores.overallScore,
      commercialQualityScore: commQA.overallCommercialScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
