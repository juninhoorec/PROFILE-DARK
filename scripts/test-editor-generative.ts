import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../src/lib/storage/db';
import { AgentEditorV2 } from '../src/lib/ai/editor/agent-editor';

console.log('🎬 Executando Teste: Agent Editor V2 Generativo (Multi-Take + Real Frames Vision QA)...\n');

async function run() {
  const outDir = path.join(process.cwd(), 'benchmarks', 'vo-zelia', 'generative-v2', 'multitake');
  await fs.mkdir(outDir, { recursive: true });

  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile: ${profile.name}`);
  console.log(`- Produto: ${product.name}`);
  console.log('- Gerando 3 takes reais e extraindo keyframes...\n');

  const startTime = Date.now();
  const multiTakeResult = await AgentEditorV2.produceSceneWithMultiTake({
    sceneNumber: 1,
    sceneTitle: 'Cena 1 — Abertura com Multi-Take V2',
    promptText: 'Oi minha gente! Dá uma olhada nesse produto maravilhoso que facilitou demais a minha rotina na cozinha.',
    profile,
    product,
    durationSeconds: 3,
    sceneType: 'character_talking',
    qualityTier: 'balanced',
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('----------------------------------------------------');
  console.log(`Cena ${multiTakeResult.sceneNumber}: ${multiTakeResult.sceneTitle}`);
  console.log('----------------------------------------------------');

  for (const take of multiTakeResult.takes) {
    const isSel = take.selected ? '✓ SELECIONADO' : '';
    const padName = take.id.padEnd(12, ' ');
    const padScore = String(take.scores.overall).padStart(3, ' ');
    console.log(`${padName} ${padScore}   ${isSel}`);
    console.log(`         • Face (30%): ${take.scores.face} | Motion (25%): ${take.scores.motion} | LipSync (20%): ${take.scores.lipSync} | Realism (15%): ${take.scores.realism} | Continuity (10%): ${take.scores.continuity}`);
    console.log(`         • Keyframes: ${take.extractedFramePaths.length} frames analisados`);
  }

  console.log('----------------------------------------------------');
  console.log(`Eleito pelo Vision QA: ${multiTakeResult.bestTake.id} (Nota Geral: ${multiTakeResult.bestTake.scores.overall}/100)`);
  console.log(`Justificativa: ${multiTakeResult.selectionRationale}`);
  console.log(`Tempo de Avaliação: ${elapsed}s`);
  console.log('----------------------------------------------------\n');

  // Copy best take video to benchmark directory
  const bestVideoDest = path.join(outDir, 'selected_best_take.mp4');
  if (multiTakeResult.bestTake.videoPath) {
    await fs.copyFile(multiTakeResult.bestTake.videoPath, bestVideoDest);
  }

  const report = {
    test: 'editor-generative',
    scene: multiTakeResult.sceneTitle,
    takesCount: multiTakeResult.takes.length,
    bestTakeId: multiTakeResult.bestTake.id,
    bestTakeScore: multiTakeResult.bestTake.scores.overall,
    rationale: multiTakeResult.selectionRationale,
    evaluationTimeSeconds: parseFloat(elapsed),
    takes: multiTakeResult.takes.map((t) => ({
      id: t.id,
      scores: t.scores,
      selected: t.selected,
      flaws: t.flaws,
    })),
    status: 'PASS',
  };
  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('====================================================');
  console.log('🎉 TESTE DO AGENT EDITOR V2 CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste do Agent Editor V2:', err);
  process.exit(1);
});
