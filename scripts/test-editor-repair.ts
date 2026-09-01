import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { SceneRepairAgent } from '../src/lib/ai/editor/scene-repair-agent';
import { TakeCandidateV2 } from '../src/lib/ai/editor/interfaces';

console.log('🛠️ Executando Teste: Scene Repair Agent (Hierarquia & Prompts Corretivos)...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile: ${profile.name}`);
  console.log(`- Produto: ${product.name}\n`);

  // Case 1: Clean Take -> KEEP
  console.log('[Caso 1] Take limpo com alta pontuação:');
  const cleanTake: TakeCandidateV2 = {
    id: 'Take A',
    takeNumber: 1,
    seed: 12040,
    videoUrl: '/api/uploads/demo.mp4',
    durationSeconds: 3,
    extractedFramePaths: [],
    scores: { face: 96, motion: 94, lipSync: 95, realism: 96, continuity: 95, product: 96, hands: 95, overall: 96, isGenerative: true },
    flaws: [],
    selected: true,
  };
  const decClean = SceneRepairAgent.evaluateAndRepair({ sceneNumber: 1, selectedTake: cleanTake, profile, product });
  console.log(`  • Decisão: ${decClean.action}`);
  console.log(`  • Justificativa: ${decClean.rationale}\n`);
  assert(decClean.action === 'KEEP', 'Take limpo deve ser mantido (KEEP)');

  // Case 2: Hand Anatomy Flaw -> REGENERATE with Structured Prompt
  console.log('[Caso 2] Problema específico de anatomia das mãos (Hands: 61):');
  const flawedHandsTake: TakeCandidateV2 = {
    id: 'Take B',
    takeNumber: 2,
    seed: 45890,
    videoUrl: '/api/uploads/demo.mp4',
    durationSeconds: 3,
    extractedFramePaths: [],
    scores: { face: 95, motion: 92, lipSync: 93, realism: 94, continuity: 95, product: 96, hands: 61, overall: 84, isGenerative: true },
    flaws: ['Anatomia manual com 6 dedos perceptíveis no frame final'],
    selected: true,
  };
  const decHands = SceneRepairAgent.evaluateAndRepair({ sceneNumber: 3, selectedTake: flawedHandsTake, profile, product });
  console.log(`  • Decisão: ${decHands.action}`);
  console.log(`  • Prompt Reparador Estruturado: ${decHands.repairedPrompt}`);
  console.log(`  • Justificativa: ${decHands.rationale}\n`);
  assert(decHands.action === 'REGENERATE', 'Falha crítica nas mãos deve disparar REGENERATE');
  assert(decHands.repairedPrompt?.includes('PRESERVE:'), 'Prompt deve conter seção PRESERVE');
  assert(decHands.repairedPrompt?.includes('CORRECT:'), 'Prompt deve conter seção CORRECT');

  // Case 3: Good Video but Poor LipSync -> LIPSYNC_FIX (without regenerating video)
  console.log('[Caso 3] Vídeo excelente mas sincronia labial fraca (LipSync: 65):');
  const flawedLipTake: TakeCandidateV2 = {
    id: 'Take C',
    takeNumber: 3,
    seed: 78120,
    videoUrl: '/api/uploads/demo.mp4',
    durationSeconds: 3,
    extractedFramePaths: [],
    scores: { face: 96, motion: 95, lipSync: 65, realism: 96, continuity: 95, product: 96, hands: 95, overall: 87, isGenerative: true },
    flaws: ['Descompasso labial'],
    selected: true,
  };
  const decLip = SceneRepairAgent.evaluateAndRepair({ sceneNumber: 1, selectedTake: flawedLipTake, profile, product });
  console.log(`  • Decisão: ${decLip.action}`);
  console.log(`  • Justificativa: ${decLip.rationale}\n`);
  assert(decLip.action === 'LIPSYNC_FIX', 'Descompasso labial com vídeo bom deve acionar LIPSYNC_FIX');

  console.log('====================================================');
  console.log('🎉 TESTE DO SCENE REPAIR AGENT CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste do Scene Repair Agent:', err);
  process.exit(1);
});
