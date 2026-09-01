import path from 'node:path';
import {
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
  VideoGenerateParams,
  VideoGenerateResult,
  VideoProvider,
} from '../engine/interfaces';
import { comfyUIProvider } from './comfyui-provider';
import { generateLongCatAvatar } from './longcat-provider';
import { createTalkingAvatar } from '../../talking-avatar';
import { newUploadPath, resolveMediaToFile } from '../../local-media';

export class WanVideoProvider implements VideoProvider {
  readonly id = 'wan-2.2';
  readonly name = 'Wan 2.2 Video (I2V / S2V)';
  readonly serviceType = 'video' as const;
  readonly providerLevel = 'LEVEL_2_GENERATIVE_I2V' as const;
  readonly qualityTier = 'maximum' as const;
  readonly isGenerative = true;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 12;
  readonly recommendedHardware: HardwareProfile = 'HIGH';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: true,
    supportsMultipleReferences: false,
    supportsCharacterConsistency: true,
    supportsProductReference: true,
    supportsAudioConditioning: true,
    supportsLipSync: true,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'Apache-2.0',
    isCommercialAllowed: true,
    attributionRequired: false,
    licenseUrl: 'https://github.com/Wan-Video/Wan2.1/blob/main/LICENSE.txt',
  };

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    const comfyOk = await comfyUIProvider.isAvailable();
    if (comfyOk) return true;
    return process.env.ENABLE_LONGCAT_ZEROGPU === 'true';
  }

  estimateCost(params: VideoGenerateParams): { credits: number; usdEstimate: number } {
    return { credits: 0, usdEstimate: 0 };
  }

  async generateVideo(params: VideoGenerateParams): Promise<VideoGenerateResult> {
    const startTime = Date.now();
    const targetDuration = Math.max(3, params.durationSeconds || 5);

    // 1. Try ComfyUI Wan 2.2 workflow if server is up
    const comfyOk = await comfyUIProvider.isAvailable();
    if (comfyOk && params.imageUrl) {
      try {
        const result = await comfyUIProvider.submitWorkflow({
          workflowName: 'video/profile-i2v.json',
          inputs: {
            '2.image': params.imageUrl,
            '3.text': params.prompt,
            '4.frames': Math.round(targetDuration * 25),
          },
          timeoutMs: 300_000,
        });

        if (result.mediaUrls.length > 0) {
          return {
            videoUrl: result.mediaUrls[0],
            thumbnailUrl: params.imageUrl,
            actualDurationSeconds: targetDuration,
            width: params.resolution === '720p' ? 720 : 544,
            height: params.resolution === '720p' ? 1280 : 704,
            fps: params.fps || 25,
            model: 'Wan 2.2 I2V (ComfyUI Local)',
            provider: 'Wan Video Engine',
            generationTimeMs: Date.now() - startTime,
            costCredits: 0,
          };
        }
      } catch (comfyErr) {
        console.warn('ComfyUI Wan 2.2 workflow fallback:', comfyErr);
      }
    }

    // 2. Resolve image and audio paths to local disk files
    const localImagePath = params.imageUrl ? await resolveMediaToFile(params.imageUrl, 'jpg') : '';
    const localAudioPath = params.audioUrl ? await resolveMediaToFile(params.audioUrl, 'wav') : '';

    // 3. Try LongCat ZeroGPU if image and audio are provided
    if (localImagePath && localAudioPath && process.env.ENABLE_LONGCAT_ZEROGPU === 'true') {
      try {
        const asset = await newUploadPath('mp4');
        await generateLongCatAvatar({
          imagePath: localImagePath,
          audioPath: localAudioPath,
          prompt: params.prompt,
          resolution: params.resolution === '720p' ? '720p' : '480p',
          seed: params.seed || 4200,
          outputPath: asset.file,
        });

        return {
          videoUrl: asset.url,
          localPath: asset.file,
          thumbnailUrl: params.imageUrl || asset.url,
          actualDurationSeconds: targetDuration,
          width: params.resolution === '720p' ? 720 : 544,
          height: params.resolution === '720p' ? 1280 : 704,
          fps: 25,
          model: 'LongCat 1.5 Avatar (ZeroGPU)',
          provider: 'LongCat Engine',
          generationTimeMs: Date.now() - startTime,
          costCredits: 0,
        };
      } catch (longcatErr) {
        console.warn('LongCat fallback error:', longcatErr);
      }
    }

    // 4. Native Local Talking Avatar Engine
    if (localImagePath && localAudioPath) {
      const asset = await newUploadPath('mp4');
      const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

      await createTalkingAvatar({
        image: localImagePath,
        audio: localAudioPath,
        output: asset.file,
        ffmpeg,
        durationSeconds: targetDuration,
      });

      return {
        videoUrl: asset.url,
        localPath: asset.file,
        thumbnailUrl: params.imageUrl || asset.url,
        actualDurationSeconds: targetDuration,
        width: 720,
        height: 1280,
        fps: 30,
        model: 'Local Avatar Synthesizer',
        provider: 'PD Local Video Engine',
        generationTimeMs: Date.now() - startTime,
        costCredits: 0,
      };
    }

    throw new Error('Geração de vídeo requer imagem de referência e áudio de narração.');
  }
}

export const wanVideoProvider = new WanVideoProvider();
