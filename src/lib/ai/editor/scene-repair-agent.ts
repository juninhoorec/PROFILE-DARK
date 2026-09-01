import { Product, Profile } from '../../types';
import { TakeCandidateV2 } from './interfaces';
import { SceneContinuityPackage } from './continuity-engine-v2';

export type RepairActionType =
  | 'KEEP'
  | 'TRIM'
  | 'REFRAME'
  | 'ALT_TAKE'
  | 'BROLL'
  | 'LIPSYNC_FIX'
  | 'REGENERATE'
  | 'NEEDS_REVIEW';

export interface RepairDecision {
  action: RepairActionType;
  selectedTakeId: string;
  repairedPrompt?: string;
  preserveDirectives?: string[];
  correctDirectives?: string[];
  trimEndTimeSeconds?: number;
  alternateTakeId?: string;
  rationale: string;
  repairCount: number;
}

export class SceneRepairAgent {
  private static readonly MAX_CREATIVE_REPAIRS = 2;

  /**
   * Decides the most efficient and quality-preserving repair strategy following strict priority:
   * 1. Trim -> 2. Alt Take -> 3. Reframe -> 4. Lip-sync fix -> 5. Regenerate with Structured Prompt -> 6. B-roll
   */
  static evaluateAndRepair(params: {
    sceneNumber: number;
    selectedTake: TakeCandidateV2;
    alternateTakes?: TakeCandidateV2[];
    profile: Profile;
    product?: Product;
    continuityPackage?: SceneContinuityPackage;
    currentRepairCount?: number;
    allowBrollFallback?: boolean;
  }): RepairDecision {
    const {
      sceneNumber,
      selectedTake,
      alternateTakes = [],
      profile,
      product,
      currentRepairCount = 0,
      allowBrollFallback = false,
    } = params;

    const scores = selectedTake.scores;

    // Check if everything is acceptable (Keep)
    const isClean =
      scores.face >= 80 &&
      scores.motion >= 75 &&
      scores.lipSync >= 78 &&
      scores.hands >= 75 &&
      scores.product >= 75;

    if (isClean) {
      return {
        action: 'KEEP',
        selectedTakeId: selectedTake.id,
        rationale: `Take ${selectedTake.id} aprovado com nota ${scores.overall}/100. Sem necessidade de reparo.`,
        repairCount: currentRepairCount,
      };
    }

    if (currentRepairCount >= this.MAX_CREATIVE_REPAIRS) {
      return {
        action: 'NEEDS_REVIEW',
        selectedTakeId: selectedTake.id,
        rationale: `Limite de ${this.MAX_CREATIVE_REPAIRS} reparos automáticos atingido para a Cena ${sceneNumber}. Requer revisão humana.`,
        repairCount: currentRepairCount,
      };
    }

    // 1. Priority: Trim (Smart cut if flaw happens near end of take)
    if (selectedTake.flaws.some((f) => f.includes('estático no final') || f.includes('drift final'))) {
      const trimTime = Math.max(2.0, selectedTake.durationSeconds - 0.4);
      return {
        action: 'TRIM',
        selectedTakeId: selectedTake.id,
        trimEndTimeSeconds: trimTime,
        rationale: `Smart Cut aplicado: vídeo aparado em ${trimTime}s antes do início de artefato temporal.`,
        repairCount: currentRepairCount,
      };
    }

    // 2. Priority: Alternate Take (if another candidate take is better)
    const viableAlt = alternateTakes.find(
      (t) =>
        t.id !== selectedTake.id &&
        t.scores.overall >= 85 &&
        t.scores.hands >= 80 &&
        t.scores.product >= 80
    );

    if (viableAlt) {
      return {
        action: 'ALT_TAKE',
        selectedTakeId: viableAlt.id,
        alternateTakeId: viableAlt.id,
        rationale: `Substituído automaticamente pelo ${viableAlt.id} (Nota: ${viableAlt.scores.overall}/100), evitando regeneração desnecessária.`,
        repairCount: currentRepairCount,
      };
    }

    // 3. Priority: LipSync Fix (if face & motion are great but lip sync is low)
    if (scores.face >= 88 && scores.motion >= 80 && scores.lipSync < 80) {
      return {
        action: 'LIPSYNC_FIX',
        selectedTakeId: selectedTake.id,
        rationale: 'Vídeo visualmente aprovado; aplicando LatentSync para corrigir sincronia labial sem regenerar Wan.',
        repairCount: currentRepairCount + 1,
      };
    }

    // 4. Priority: B-roll insertion (if explicitly allowed for secondary shot)
    if (allowBrollFallback && scores.hands < 70 && product && scores.product >= 85) {
      return {
        action: 'BROLL',
        selectedTakeId: selectedTake.id,
        rationale: 'Substituição de ângulo manual imperfeito por B-roll cinematográfico de detalhe do produto.',
        repairCount: currentRepairCount + 1,
      };
    }

    // 5. Priority: Structured Partial/Full Scene Regeneration (Spec 14 & 15)
    const preserveDirectives: string[] = [
      `profile identity of ${profile.name}`,
      'hair styling and natural skin tone',
      'warm cozy wardrobe',
      'kitchen environment background',
      '5600K ambient lighting',
    ];

    const correctDirectives: string[] = [];
    if (scores.hands < 75) {
      correctDirectives.push('right hand anatomical grip with 5 distinct fingers', 'natural wrist pose', 'contact shadow on surface');
    }
    if (scores.product < 75 && product) {
      correctDirectives.push(`exact geometry and label fidelity for ${product.name}`, 'correct scale proportion');
    }
    if (scores.face < 80) {
      correctDirectives.push('strict facial bone structure fidelity from master reference', 'organic smile and blinking');
    }
    if (scores.motion < 75) {
      correctDirectives.push('smooth kinematic motion', 'natural head tilt');
    }

    const structuredPrompt = `PRESERVE: ${preserveDirectives.join(', ')}. CORRECT: ${correctDirectives.join(', ')}.`;

    return {
      action: 'REGENERATE',
      selectedTakeId: selectedTake.id,
      repairedPrompt: structuredPrompt,
      preserveDirectives,
      correctDirectives,
      rationale: `Regenerando apenas a Cena ${sceneNumber} com prompt corretivo estruturado (${correctDirectives.join(', ')}).`,
      repairCount: currentRepairCount + 1,
    };
  }
}
