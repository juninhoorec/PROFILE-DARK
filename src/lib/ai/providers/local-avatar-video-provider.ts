import path from 'node:path';
import {
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
  VideoGenerateParams,
  VideoGenerateResult,
  VideoProvider,
} from '../engine/interfaces';
import { createTalkingAvatar } from '../../talking-avatar';
import { newUploadPath, resolveMediaToFile } from '../../local-media';

export class LocalTalkingAvatarVideoProvider implements VideoProvider {
  readonly id = 'local-talking-avatar';
  readonly name = 'Local Talking Avatar Synthesizer (2D Audio Warp)';
  readonly serviceType = 'video' as const;
  readonly providerLevel = 'LEVEL_1_TALKING_AVATAR_2D' as const;
  readonly qualityTier = 'preview' as const;
  readonly isGenerative = false;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 0;
  readonly recommendedHardware: HardwareProfile = 'LOW';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: true,
    supportsMultipleReferences: false,
    supportsCharacterConsistency: true,
    supportsProductReference: true,
    supportsAudioConditioning: true,
    supportsLipSync: true,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'MIT / Commercial Safe',
    isCommercialAllowed: true,
    attributionRequired: false,
  };

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  estimateCost(): { credits: number; usdEstimate: number } {
    return { credits: 0, usdEstimate: 0 };
  }

  async generateVideo(params: VideoGenerateParams): Promise<VideoGenerateResult> {
    const startTime = Date.now();
    const targetDuration = Math.max(1, params.durationSeconds || 3);

    const localImagePath = params.imageUrl ? await resolveMediaToFile(params.imageUrl, 'jpg') : '';
    const localAudioPath = params.audioUrl ? await resolveMediaToFile(params.audioUrl, 'wav') : '';

    if (!localImagePath || !localAudioPath) {
      throw new Error('LocalTalkingAvatarVideoProvider requer imagem e áudio de narração.');
    }

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
      model: 'Local Talking Avatar Synthesizer (2D Envelope)',
      provider: 'PD Local Synthesizer',
      generationTimeMs: Date.now() - startTime,
      costCredits: 0,
    };
  }
}

export const localTalkingAvatarVideoProvider = new LocalTalkingAvatarVideoProvider();
