import {
  CommercialLicenseInfo,
  HardwareProfile,
  ImageGenerateParams,
  ImageGenerateResult,
  ImageProvider,
  ProviderCapabilities,
} from '../engine/interfaces';
import { comfyUIProvider } from './comfyui-provider';

export class QwenImageProvider implements ImageProvider {
  readonly id = 'qwen-image';
  readonly name = 'Qwen-Image / Qwen2.5-VL';
  readonly serviceType = 'image' as const;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 8;
  readonly recommendedHardware: HardwareProfile = 'MEDIUM';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: true,
    supportsMultipleReferences: true,
    supportsCharacterConsistency: true,
    supportsProductReference: true,
    supportsAudioConditioning: false,
    supportsLipSync: false,
    supportsInpainting: true,
    supportsControlNet: true,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'Apache-2.0',
    isCommercialAllowed: true,
    attributionRequired: false,
    licenseUrl: 'https://github.com/QwenLM/Qwen2.5-VL/blob/main/LICENSE',
    notes: 'Permissive Apache 2.0 license by Alibaba Cloud for commercial and research use.',
  };

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    const comfyAvailable = await comfyUIProvider.isAvailable();
    if (comfyAvailable) return true;
    return Boolean(process.env.OPENAI_API_KEY || process.env.FAL_KEY || process.env.REPLICATE_API_TOKEN);
  }

  estimateCost(): { credits: number; usdEstimate: number } {
    return { credits: 0, usdEstimate: 0 };
  }

  async generateImage(params: ImageGenerateParams): Promise<ImageGenerateResult> {
    const startTime = Date.now();

    const comfyOk = await comfyUIProvider.isAvailable();
    if (comfyOk) {
      try {
        const result = await comfyUIProvider.submitWorkflow({
          workflowName: 'image/product-scene.json',
          inputs: {
            '6.text': params.prompt,
            '7.text': params.negativePrompt || 'blurry, cartoon, deformed, low resolution',
            '8.width': params.resolution?.width || 768,
            '8.height': params.resolution?.height || 1360,
            '9.seed': params.seed || Math.floor(Math.random() * 1_000_000_000),
          },
        });

        if (result.mediaUrls.length > 0) {
          return {
            url: result.mediaUrls[0],
            width: params.resolution?.width || 768,
            height: params.resolution?.height || 1360,
            seed: params.seed || 42,
            model: 'Qwen-Image / IP-Adapter',
            provider: 'ComfyUI Local',
            generationTimeMs: Date.now() - startTime,
            costCredits: 0,
          };
        }
      } catch (err) {
        console.warn('ComfyUI Qwen workflow error:', err);
      }
    }

    throw new Error(
      'Qwen-Image requer ComfyUI ativo (http://127.0.0.1:8188) ou worker local configurado para edição por multi-referência.'
    );
  }
}

export const qwenImageProvider = new QwenImageProvider();
