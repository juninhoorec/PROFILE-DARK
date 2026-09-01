import { Product, Profile } from '../../types';
import { MultiTakeSceneResultV2 } from './interfaces';
import { MultiTakeEngineV2 } from './multi-take-engine-v2';

export class MultiTakeEngine {
  /**
   * Generates 3 candidate takes for a single scene and uses Vision QA to select the best one.
   */
  static async evaluateSceneMultiTake(params: {
    sceneNumber?: number;
    sceneTitle?: string;
    promptText: string;
    profile: Profile;
    product?: Product;
    durationSeconds?: number;
    referenceImage?: string;
  }): Promise<MultiTakeSceneResultV2> {
    return MultiTakeEngineV2.evaluateSceneMultiTake({
      sceneNumber: params.sceneNumber || 1,
      sceneTitle: params.sceneTitle || 'Cena 1 — Abertura & Gancho',
      promptText: params.promptText,
      profile: params.profile,
      product: params.product,
      durationSeconds: params.durationSeconds || 3,
      referenceImage: params.referenceImage,
    });
  }
}
