import { Product, Profile } from '../../types';
import { TakeCandidateV2 } from './interfaces';

export interface RepairPromptInput {
  basePrompt: string;
  profile: Profile;
  product?: Product;
  flawedTake: TakeCandidateV2;
  previousLastFramePath?: string;
}

export class AgentRepairEngine {
  /**
   * Constructs a targeted corrective prompt to fix specific Vision QA flaws.
   */
  static buildRepairPrompt(input: RepairPromptInput): { repairedPrompt: string; rationale: string } {
    const { basePrompt, profile, product, flawedTake } = input;
    const scores = flawedTake.scores;
    const repairDirectives: string[] = [];
    const reasons: string[] = [];

    if (scores.hands < 80) {
      repairDirectives.push('ultra-precise hand anatomy with clean distinct 5 fingers, natural ergonomic grip on the item, no hand morphing or blurring');
      reasons.push(`Ajuste de anatomia das mãos (Nota anterior: ${scores.hands})`);
    }

    if (scores.product < 80 && product) {
      repairDirectives.push(`exact product fidelity for ${product.name}, crisp packaging text, distinct edges, correct physical scale and lighting reflection`);
      reasons.push(`Ajuste de fidelidade do produto (Nota anterior: ${scores.product})`);
    }

    if (scores.face < 80) {
      repairDirectives.push(`preserve identical facial features of ${profile.name}, natural skin pores, realistic eyelid blink, correct age details`);
      reasons.push(`Ajuste de consistência facial (Nota anterior: ${scores.face})`);
    }

    if (scores.motion < 80) {
      repairDirectives.push('smooth physics-based organic movement, natural head tilt, subtle breathing kinematics, 30fps stability');
      reasons.push(`Ajuste de fluidez de movimento (Nota anterior: ${scores.motion})`);
    }

    if (repairDirectives.length === 0) {
      repairDirectives.push('enhanced physical realism, sharp microtextures, balanced ambient light');
      reasons.push('Refinamento geral de iluminação e textura');
    }

    const repairedPrompt = `${basePrompt}. [AGENT REPAIR CORRECTION: ${repairDirectives.join(', ')}]`;
    const rationale = `Agent Repair acionado: ${reasons.join('; ')}.`;

    return { repairedPrompt, rationale };
  }
}
