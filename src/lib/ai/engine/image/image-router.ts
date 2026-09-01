import { ImageGenerateParams, ImageGenerateResult, ImageProvider } from '../interfaces';
import { fluxKleinProvider } from '../../providers/flux-klein-provider';
import { qwenImageProvider } from '../../providers/qwen-image-provider';

export type ImageTaskType =
  | 'master_portrait'
  | 'multi_reference_edit'
  | 'text_heavy'
  | 'fast_preview'
  | 'product_interaction';

export class ImageRouter {
  private static providers: ImageProvider[] = [fluxKleinProvider, qwenImageProvider];

  static selectProvider(taskType: ImageTaskType, params: ImageGenerateParams): ImageProvider {
    // If multi-reference or text-heavy edit, prefer Qwen-Image
    if (
      taskType === 'multi_reference_edit' ||
      taskType === 'text_heavy' ||
      (params.referenceUrls && params.referenceUrls.length > 1)
    ) {
      return qwenImageProvider;
    }

    // Default to FLUX.2 [klein] 4B for master portraits and high-realism scenes
    return fluxKleinProvider;
  }

  static async generate(
    params: ImageGenerateParams,
    taskType: ImageTaskType = 'master_portrait'
  ): Promise<ImageGenerateResult> {
    const selected = this.selectProvider(taskType, params);

    try {
      return await selected.generateImage(params);
    } catch (primaryErr) {
      console.warn(`Primary image provider (${selected.name}) failed, attempting fallback:`, primaryErr);

      // Try alternate provider
      const fallback = this.providers.find((p) => p.id !== selected.id);
      if (fallback) {
        try {
          return await fallback.generateImage(params);
        } catch (fallbackErr) {
          console.warn(`Fallback provider (${fallback.name}) failed:`, fallbackErr);
        }
      }

      throw primaryErr;
    }
  }
}
