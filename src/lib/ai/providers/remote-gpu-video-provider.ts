import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
  VideoGenerateParams,
  VideoGenerateResult,
  VideoProvider,
} from '../engine/interfaces';
import { ComfyUIProvider } from './comfyui-provider';
import { generateLongCatAvatar } from './longcat-provider';
import { newUploadPath, resolveMediaToFile } from '../../local-media';

export class RemoteGpuVideoProvider implements VideoProvider {
  readonly id = 'remote-gpu-wan';
  readonly name = 'Remote GPU Video Provider (Wan 2.2 / ComfyUI / ZeroGPU)';
  readonly serviceType = 'video' as const;
  readonly providerLevel = 'LEVEL_2_GENERATIVE_I2V' as const;
  readonly qualityTier = 'maximum' as const;
  readonly isGenerative = true;
  readonly isLocal: boolean = false;
  readonly minVramGb: number = 16;
  readonly recommendedHardware: HardwareProfile = 'REMOTE';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: true,
    supportsMultipleReferences: true,
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

  private remoteUrl: string;
  private apiKey: string;
  private comfyClient?: ComfyUIProvider;

  constructor() {
    this.remoteUrl = process.env.COMFYUI_REMOTE_URL || process.env.COMFYUI_URL || '';
    this.apiKey = process.env.COMFYUI_REMOTE_API_KEY || '';
    if (this.remoteUrl) {
      this.comfyClient = new ComfyUIProvider(this.remoteUrl);
    }
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(
      this.remoteUrl ||
      process.env.FAL_KEY ||
      process.env.REPLICATE_API_TOKEN ||
      process.env.RUNWAY_API_KEY ||
      process.env.ENABLE_LONGCAT_ZEROGPU === 'true'
    );
  }

  async isAvailable(): Promise<boolean> {
    if (this.comfyClient) {
      const ok = await this.comfyClient.isAvailable();
      if (ok) return true;
    }
    return Boolean(
      process.env.FAL_KEY ||
      process.env.REPLICATE_API_TOKEN ||
      process.env.RUNWAY_API_KEY ||
      process.env.ENABLE_LONGCAT_ZEROGPU === 'true'
    );
  }

  async checkHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED'; latencyMs: number; details: string }> {
    const start = Date.now();
    if (!this.remoteUrl && !process.env.ENABLE_LONGCAT_ZEROGPU && !process.env.FAL_KEY && !process.env.RUNWAY_API_KEY) {
      return {
        status: 'NOT_CONFIGURED',
        latencyMs: 0,
        details: 'Nenhum servidor ComfyUI remoto ou chave de GPU remota configurada.',
      };
    }

    if (this.comfyClient) {
      const ok = await this.comfyClient.isAvailable();
      if (ok) {
        return {
          status: 'HEALTHY',
          latencyMs: Date.now() - start,
          details: `Conectado ao ComfyUI Remoto (${this.remoteUrl}). Wan 2.2 pronto.`,
        };
      }
    }

    if (process.env.ENABLE_LONGCAT_ZEROGPU === 'true') {
      return {
        status: 'HEALTHY',
        latencyMs: Date.now() - start,
        details: 'Gradio ZeroGPU (LongCat 1.5) operacional para vídeo generativo.',
      };
    }

    return {
      status: 'DEGRADED',
      latencyMs: Date.now() - start,
      details: 'Provider remoto configurado, mas o endpoint não respondeu.',
    };
  }

  estimateCost(params: VideoGenerateParams): { credits: number; usdEstimate: number } {
    return { credits: Math.round(params.durationSeconds * 3), usdEstimate: 0.05 };
  }

  async generateVideo(params: VideoGenerateParams): Promise<VideoGenerateResult> {
    const startTime = Date.now();
    const targetDuration = Math.max(3, params.durationSeconds || 5);

    const localImagePath = params.imageUrl ? await resolveMediaToFile(params.imageUrl, 'jpg') : '';
    const localAudioPath = params.audioUrl ? await resolveMediaToFile(params.audioUrl, 'wav') : '';

    // 1. Try Remote ComfyUI Wan 2.2 Workflow
    if (this.comfyClient && localImagePath) {
      const available = await this.comfyClient.isAvailable();
      if (available) {
        try {
          const result = await this.comfyClient.submitWorkflow({
            workflowName: 'video/profile-i2v.json',
            inputs: {
              '2.image': localImagePath,
              '3.text': params.prompt,
              '4.frames': Math.round(targetDuration * 25),
            },
            timeoutMs: 300_000,
          });

          if (result.mediaUrls.length > 0) {
            // Download remote video to local storage
            const asset = await newUploadPath('mp4');
            const res = await fetch(result.mediaUrls[0]);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              await fs.writeFile(asset.file, buf);
              return {
                videoUrl: asset.url,
                localPath: asset.file,
                thumbnailUrl: params.imageUrl || asset.url,
                actualDurationSeconds: targetDuration,
                width: params.resolution === '720p' ? 720 : 544,
                height: params.resolution === '720p' ? 1280 : 704,
                fps: params.fps || 25,
                model: 'Wan 2.2 I2V (Remote ComfyUI GPU)',
                provider: 'Remote GPU Worker',
                generationTimeMs: Date.now() - startTime,
                costCredits: 0,
              };
            }
          }
        } catch (comfyErr) {
          console.warn('Remote ComfyUI execution failed:', comfyErr);
        }
      }
    }

    // 2. Try LongCat ZeroGPU if enabled
    if (localImagePath && localAudioPath && (process.env.ENABLE_LONGCAT_ZEROGPU === 'true' || !this.remoteUrl)) {
      try {
        const asset = await newUploadPath('mp4');
        await generateLongCatAvatar({
          imagePath: localImagePath,
          audioPath: localAudioPath,
          prompt: params.prompt,
          resolution: params.resolution === '720p' ? '720p' : '480p',
          seed: params.seed || Math.floor(Math.random() * 2_000_000_000),
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
          model: 'LongCat 1.5 Avatar (ZeroGPU Generative)',
          provider: 'Remote GPU Worker (ZeroGPU)',
          generationTimeMs: Date.now() - startTime,
          costCredits: 0,
        };
      } catch (longcatErr) {
        console.warn('ZeroGPU LongCat generation error:', longcatErr);
      }
    }

    throw new Error(
      'Vídeo generativo de alta qualidade indisponível. Configure COMFYUI_REMOTE_URL ou habilite ENABLE_LONGCAT_ZEROGPU=true.'
    );
  }
}

export const remoteGpuVideoProvider = new RemoteGpuVideoProvider();
