export interface StructuredEditPlan {
  userPrompt: string;
  intent: 'REGENERATE_SINGLE_SCENE' | 'REGENERATE_VOICE_SEGMENT' | 'REORDER_BROLL' | 'REFINE_PROMPT' | 'FULL_RERENDER';
  preserveScenes: number[];
  regenerateScenes: number[];
  regenerateVoiceSegments: number[];
  timelineChanges: string[];
  estimatedCredits: number;
  explanation: string;
  version: number;
}

export class AgentEditPlanner {
  /**
   * Translates natural language editing requests into precise, atomic execution plans.
   */
  static parseUserInstruction(
    instruction: string,
    totalScenes = 5,
    currentVersion = 1
  ): StructuredEditPlan {
    const text = instruction.toLowerCase().trim();
    const nextVersion = currentVersion + 1;

    // Pattern 1: Regenerate specific scene (e.g. "Troque apenas a cena 3", "Refaça a cena 2")
    const sceneMatch = text.match(/(?:cena|scene|trecho)\s*(\d+)/i);
    const isSingleScene = sceneMatch && (text.includes('apenas') || text.includes('somente') || text.includes('refaça') || text.includes('troque'));

    if (isSingleScene && sceneMatch) {
      const targetScene = parseInt(sceneMatch[1], 10);
      const preserve = Array.from({ length: totalScenes }, (_, i) => i + 1).filter((s) => s !== targetScene);

      return {
        userPrompt: instruction,
        intent: 'REGENERATE_SINGLE_SCENE',
        preserveScenes: preserve,
        regenerateScenes: [targetScene],
        regenerateVoiceSegments: [],
        timelineChanges: [`Regenerar Cena ${targetScene} mantendo as demais intactas`],
        estimatedCredits: 5,
        explanation: `Vou preservar as cenas ${preserve.join(', ')} e regenerar exclusivamente a Cena ${targetScene}.`,
        version: nextVersion,
      };
    }

    // Pattern 2: Voice or CTA refinement (e.g. "Deixe a fala da cena final mais natural", "Refaça a última frase")
    if (text.includes('fala') || text.includes('voz') || text.includes('frase') || text.includes('cta')) {
      const targetScene = text.includes('final') || text.includes('última') ? totalScenes : 1;
      const preserve = Array.from({ length: totalScenes }, (_, i) => i + 1).filter((s) => s !== targetScene);

      return {
        userPrompt: instruction,
        intent: 'REGENERATE_VOICE_SEGMENT',
        preserveScenes: preserve,
        regenerateScenes: [],
        regenerateVoiceSegments: [targetScene],
        timelineChanges: [`Atualizar narração e sincronizar LipSync na Cena ${targetScene}`],
        estimatedCredits: 2,
        explanation: `Vou manter todas as cenas de vídeo anteriores e regravar apenas a narração da Cena ${targetScene} com novo LipSync.`,
        version: nextVersion,
      };
    }

    // Pattern 3: Editorial reordering (e.g. "Mostre o produto mais cedo")
    if (text.includes('produto mais cedo') || text.includes('reordenar') || text.includes('adiante o produto')) {
      const allScenes = Array.from({ length: totalScenes }, (_, i) => i + 1);

      return {
        userPrompt: instruction,
        intent: 'REORDER_BROLL',
        preserveScenes: allScenes,
        regenerateScenes: [],
        regenerateVoiceSegments: [],
        timelineChanges: ['Antecipar B-roll do produto na timeline sem regerar takes de vídeo'],
        estimatedCredits: 0,
        explanation: 'Vou reordenar a sequência editorial para exibir o produto nos primeiros 4 segundos sem custo adicional de GPU.',
        version: nextVersion,
      };
    }

    // Default: General refinement
    const preserve = Array.from({ length: totalScenes }, (_, i) => i + 1).slice(0, 3);
    const regen = Array.from({ length: totalScenes }, (_, i) => i + 1).slice(3);

    return {
      userPrompt: instruction,
      intent: 'REFINE_PROMPT',
      preserveScenes: preserve,
      regenerateScenes: regen,
      regenerateVoiceSegments: [],
      timelineChanges: ['Refinar tom cinematográfico e composição de luz'],
      estimatedCredits: 8,
      explanation: `Vou manter o início (${preserve.join(', ')}) e atualizar as cenas de fechamento (${regen.join(', ')}).`,
      version: nextVersion,
    };
  }
}
