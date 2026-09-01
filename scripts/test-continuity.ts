import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { ContinuityEngineV2 } from '../src/lib/ai/editor/continuity-engine-v2';
import { ContactSheetGenerator } from '../src/lib/ai/editor/visual-contact-sheet';
import { IdentityConsistencyEvaluator, ProductConsistencyEvaluator } from '../src/lib/ai/editor/identity-evaluator';

console.log('🔄 Executando Teste: Continuity Engine V2 & Contact Sheet Visual...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  const benchVideo = path.join(process.cwd(), 'benchmarks', 'vo-zelia', 'generative-v2', 'wan-3s', 'wan-3s.mp4');
  const outDir = path.join(process.cwd(), 'benchmarks', 'vo-zelia', 'generative-v2', 'continuity');
  await fs.mkdir(outDir, { recursive: true });

  // 1. Generate Contact Sheet (8 frames)
  console.log('[1/3] Gerando Contact Sheet Visual (8 keyframes)...');
  const sheetDest = path.join(outDir, 'contact-sheet.jpg');
  const sheetResult = await ContactSheetGenerator.generateContactSheet(benchVideo, sheetDest, 3);
  console.log(`  ✓ contact-sheet.jpg gerado em ${sheetResult.contactSheetPath}`);
  console.log(`  • Percentuais extraídos: ${sheetResult.percentages.join('%, ')}%`);

  // 2. Extract Scene End Reference
  console.log('\n[2/3] Extraindo scene-end-reference.png...');
  const endRefPath = await ContinuityEngineV2.extractSceneEndReference(benchVideo, outDir);
  console.log(`  ✓ scene-end-reference.png salvo em ${endRefPath}`);

  const continuityPkg = ContinuityEngineV2.buildContinuityPackage({
    sceneNumber: 1,
    videoPath: benchVideo,
    sceneEndRefPath: endRefPath,
    currentShotType: 'talking_head',
    nextShotType: 'product_demo',
    profileName: profile.name,
    productName: product.name,
  });

  console.log(`  • Tipo de Transição Detectada: ${continuityPkg.nextSceneTransitionType}`);
  console.log(`  • Estado de Câmera: ${continuityPkg.continuityState.cameraState}`);
  console.log(`  • Estado de Iluminação: ${continuityPkg.continuityState.lightingState}`);

  // 3. Evaluate Identity & Product Consistency
  console.log('\n[3/3] Avaliando Consistência de Identidade e Produto:');
  const idEval = IdentityConsistencyEvaluator.evaluateIdentity({
    durationSeconds: 3,
    profile,
    masterReferencePath: path.join(process.cwd(), 'benchmarks', 'vo-zelia', 'master-reference.png'),
  });
  console.log(`  • Nota Geral de Identidade: ${idEval.overallIdentityScore}/100`);
  console.log(`  • Resumo de Identidade: ${idEval.summary}`);

  const prodEval = ProductConsistencyEvaluator.evaluateProduct({
    product,
    durationSeconds: 3,
  });
  console.log(`  • Nota Geral do Produto: ${prodEval.overallProductScore}/100`);
  console.log(`  • Resumo do Produto: ${prodEval.summary}`);

  assert(sheetResult.percentages.length === 8, 'Devem ser extraídos 8 percentuais no contact sheet');
  assert(Boolean(endRefPath), 'scene-end-reference.png deve existir');
  assert(idEval.hasIdentityDrift === false, 'Não deve haver deriva de identidade');
  assert(prodEval.hasProductDrift === false, 'Não deve haver deriva de produto');

  console.log('\n====================================================');
  console.log('🎉 TESTE DE CONTINUIDADE & CONTACT SHEET CONCLUÍDO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste de continuidade:', err);
  process.exit(1);
});
