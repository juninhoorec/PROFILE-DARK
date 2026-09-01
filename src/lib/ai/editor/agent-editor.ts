import { Product, Profile } from '../../types';
import { MultiTakeEngine } from './multi-take-engine';
import { MultiTakeEngineV2 } from './multi-take-engine-v2';
import { MultiTakeSceneResult, MultiTakeSceneResultV2 } from './interfaces';
import { VideoQualityTier } from '../engine/interfaces';
import { VideoSceneType } from '../engine/video/video-router';

/**
 * AGENT EDITOR
 * High-level orchestration layer sitting directly above GENERATION_ENGINE_BASELINE_V1 & V2.
 * Coordinates Scene Planning -> Multi-Take Generation -> Vision QA -> Best Take Selection -> Repair -> Continuity -> Final Assembly.
 */
export class AgentEditor {
  /**
   * Generates multiple takes for a scene and automatically selects the highest-quality take.
   */
  static async produceSceneWithMultiTake(params: {
    sceneNumber?: number;
    sceneTitle?: string;
    promptText?: string;
    profile: Profile;
    product?: Product;
    durationSeconds?: number;
    sceneType?: VideoSceneType;
    qualityTier?: VideoQualityTier;
    previousLastFramePath?: string;
  }): Promise<MultiTakeSceneResultV2> {
    const prompt =
      params.promptText ||
      `Oi minha gente! Eu sou a ${params.profile.name}. Deixa eu te contar um segredo que vai facilitar o seu dia a dia.`;

    return MultiTakeEngineV2.evaluateSceneMultiTake({
      sceneNumber: params.sceneNumber || 1,
      sceneTitle: params.sceneTitle || 'Cena 1 — Abertura com Multi-Take V2',
      promptText: prompt,
      profile: params.profile,
      product: params.product,
      durationSeconds: params.durationSeconds || 3,
      sceneType: params.sceneType || 'character_talking',
      qualityTier: params.qualityTier || 'balanced',
      previousLastFramePath: params.previousLastFramePath,
    });
  }
}

export const AgentEditorV2 = AgentEditor;
