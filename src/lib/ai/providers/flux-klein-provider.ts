import {
  CommercialLicenseInfo,
  HardwareProfile,
  ImageGenerateParams,
  ImageGenerateResult,
  ImageProvider,
  ProviderCapabilities,
} from '../engine/interfaces';
import { comfyUIProvider } from './comfyui-provider';
import { newUploadPath } from '../../local-media';
import fs from 'node:fs/promises';

export class FluxKleinProvider implements ImageProvider {
  readonly id = 'flux-2-klein-4b';
  readonly name = 'FLUX.2 [klein] 4B';
  readonly serviceType = 'image' as const;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 6;
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
    licenseUrl: 'https://github.com/black-forest-labs/flux/blob/main/LICENSE.md',
    notes: 'Permissive Apache 2.0 commercial license on the 4B klein variant.',
  };

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    const comfyAvailable = await comfyUIProvider.isAvailable();
    if (comfyAvailable) return true;
    return Boolean(process.env.FAL_KEY || process.env.REPLICATE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN);
  }

  estimateCost(params: ImageGenerateParams): { credits: number; usdEstimate: number } {
    return { credits: 0, usdEstimate: 0 };
  }

  async generateImage(params: ImageGenerateParams): Promise<ImageGenerateResult> {
    const startTime = Date.now();

    const comfyOk = await comfyUIProvider.isAvailable();
    if (comfyOk) {
      try {
        const result = await comfyUIProvider.submitWorkflow({
          workflowName: 'image/profile-master.json',
          inputs: {
            '4.text': params.prompt,
            '5.text': params.negativePrompt || 'plastic skin, blurry, cartoon, low resolution',
            '6.width': params.resolution?.width || (params.aspectRatio === '16:9' ? 1280 : 768),
            '6.height': params.resolution?.height || (params.aspectRatio === '16:9' ? 720 : 1360),
            '7.seed': params.seed || Math.floor(Math.random() * 1_000_000_000),
            '7.steps': params.steps || 20,
          },
        });

        if (result.mediaUrls.length > 0) {
          return {
            url: result.mediaUrls[0],
            width: params.resolution?.width || 768,
            height: params.resolution?.height || 1360,
            seed: params.seed || 42,
            model: 'FLUX.2 [klein] 4B',
            provider: 'ComfyUI Local',
            generationTimeMs: Date.now() - startTime,
            costCredits: 0,
          };
        }
      } catch (err) {
        console.warn('ComfyUI FLUX workflow fallback:', err);
      }
    }

    if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: params.prompt,
              steps: Math.min(8, params.steps || 4),
            }),
            signal: AbortSignal.timeout(30_000),
          }
        );

        if (cfRes.ok) {
          const bytes = Buffer.from(await cfRes.arrayBuffer());
          const asset = await newUploadPath('png');
          await fs.writeFile(asset.file, bytes);
          return {
            url: asset.url,
            localPath: asset.file,
            width: 768,
            height: 1024,
            seed: params.seed || 1,
            model: 'FLUX.1 Schnell (Cloudflare Free AI)',
            provider: 'Cloudflare AI',
            generationTimeMs: Date.now() - startTime,
            costCredits: 0,
          };
        }
      } catch (cfErr) {
        console.warn('Cloudflare FLUX fallback error:', cfErr);
      }
    }

    throw new Error(
      'FLUX.2 [klein] 4B requer ComfyUI ativo (http://127.0.0.1:8188) ou credencial Cloudflare AI configurada.'
    );
  }
}

export const fluxKleinProvider = new FluxKleinProvider();
