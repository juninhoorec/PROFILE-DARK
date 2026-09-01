import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { AgentEditor } from '../src/lib/ai/editor/agent-editor';

console.log('🎬 Executando Teste do AGENT EDITOR (Multi-Take + Vision QA Selection)...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile: ${profile.name}`);
  console.log(`- Produto: ${product.name}`);
  console.log('- Executando geração de 3 takes para a Cena 1 (3 segundos)...\n');

  const startTime = Date.now();
  const multiTakeResult = await AgentEditor.produceSceneWithMultiTake({
    profile,
    product,
    promptText: 'Oi minha gente! Dá uma olhada nesse produto maravilhoso que eu tenho aqui na cozinha.',
    durationSeconds: 3,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('----------------------------------------------------');
  console.log(`Cena ${multiTakeResult.sceneNumber}: ${multiTakeResult.sceneTitle}`);
  console.log('----------------------------------------------------');

  for (const take of multiTakeResult.takes) {
    const isSel = take.selected ? '✓ Selecionado' : '';
    const padName = take.id.padEnd(8, ' ');
    const padScore = String(take.scores.overall).padStart(3, ' ');
    console.log(`${padName} ${padScore}   ${isSel}`);
    console.log(`         • Face: ${take.scores.face} | Realism: ${take.scores.realism} | Motion: ${take.scores.motion} | Hands: ${take.scores.hands} | Product: ${take.scores.product}`);
  }

  console.log('----------------------------------------------------');
  console.log(`Selecionado automaticamente: ${multiTakeResult.bestTake.id} (Nota: ${multiTakeResult.bestTake.scores.overall}/100)`);
  console.log(`URL do Vídeo Escolhido: ${multiTakeResult.bestTake.videoUrl}`);
  console.log(`Justificativa Vision QA: ${multiTakeResult.selectionRationale}`);
  console.log(`Tempo de Avaliação: ${elapsed}s`);
  console.log('----------------------------------------------------\n');

  assert(multiTakeResult.takes.length === 3, 'Devem ser gerados exatamente 3 takes');
  assert(Boolean(multiTakeResult.bestTake), 'Um take deve ser selecionado como o melhor');
  assert(multiTakeResult.bestTake.selected === true, 'O melhor take deve estar marcado como selected');

  console.log('====================================================');
  console.log('🎉 TESTE DO AGENT EDITOR MULTI-TAKE CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste do Agent Editor:', err);
  process.exit(1);
});
