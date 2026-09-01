import {
  VideoGenerateParams,
  VideoGenerateResult,
  VideoProvider,
  VideoQualityTier,
} from '../interfaces';
import { wanVideoProvider } from '../../providers/wan-video-provider';
import { remoteGpuVideoProvider } from '../../providers/remote-gpu-video-provider';
import { localTalkingAvatarVideoProvider } from '../../providers/local-avatar-video-provider';

export type VideoSceneType =
  | 'character_talking'
  | 'character_movement'
  | 'product_closeup'
  | 'b_roll';

export class SmartVideoRouter {
  private static providers: VideoProvider[] = [
    remoteGpuVideoProvider,
    wanVideoProvider,
    localTalkingAvatarVideoProvider,
  ];

  static async selectProvider(
    sceneType: VideoSceneType,
    qualityTier: VideoQualityTier = 'balanced'
  ): Promise<VideoProvider> {
    if (qualityTier === 'preview') {
      return localTalkingAvatarVideoProvider;
    }

    if (qualityTier === 'maximum') {
      const remoteAvailable = await remoteGpuVideoProvider.isAvailable();
      if (remoteAvailable) return remoteGpuVideoProvider;

      const wanAvailable = await wanVideoProvider.isAvailable();
      if (wanAvailable) return wanVideoProvider;

      throw new Error(
        'Vídeo generativo de alta qualidade indisponível. Configure um GPU Provider remoto (COMFYUI_REMOTE_URL) em Configurações > Modelos IA.'
      );
    }

    // Balanced Mode: Try generative remote first, then fallback to local
    const remoteAvailable = await remoteGpuVideoProvider.isAvailable();
    if (remoteAvailable) return remoteGpuVideoProvider;

    const wanAvailable = await wanVideoProvider.isAvailable();
    if (wanAvailable) return wanVideoProvider;

    console.info('[SmartVideoRouter] Generative GPU offline em modo balanced. Usando fallback 2D local.');
    return localTalkingAvatarVideoProvider;
  }

  static async generate(
    params: VideoGenerateParams & { qualityTier?: VideoQualityTier },
    sceneType: VideoSceneType = 'character_talking'
  ): Promise<VideoGenerateResult> {
    const tier = params.qualityTier || (params.isSmokeTest ? 'preview' : 'balanced');
    const selected = await this.selectProvider(sceneType, tier);
    return await selected.generateVideo(params);
  }
}

// Backward-compatible alias
export const VideoRouter = SmartVideoRouter;
