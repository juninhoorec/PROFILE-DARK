import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { BatchCreativeDirector } from '../src/lib/ai/production/batch-creative-director';
import { ProductionPipeline } from '../src/lib/ai/production/production-pipeline';

console.log('🔄 Executando Teste: Checkpoint & Retomada Transacional de Falha...\n');

async function getFileHash(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  const batchPlans = BatchCreativeDirector.generateBatchPlans({ profile, product });
  const testPlan = batchPlans.plans[0];
  testPlan.projectId = `test_resume_${Date.now()}`;

  console.log(`[1/3] Simulando Execução com Falha Forçada na Cena 3...`);
  let failedAsExpected = false;
  try {
    await ProductionPipeline.runProject({
      plan: testPlan,
      profile,
      product,
      forceFailSceneNumber: 3,
    });
  } catch (err: any) {
    console.log(`  ✓ Falha simulada capturada: "${err.message}"`);
    failedAsExpected = true;
  }
  assert(failedAsExpected === true, 'A execução deve falhar na cena 3');

  const projectDir = path.join(process.cwd(), 'data', 'projects', testPlan.projectId);
  const sc1Path = path.join(projectDir, 'scene_1', 'raw.mp4');
  const sc2Path = path.join(projectDir, 'scene_2', 'raw.mp4');

  const sc1HashBefore = await getFileHash(sc1Path);
  const sc2HashBefore = await getFileHash(sc2Path);

  console.log('\n[2/3] Verificando Checkpoint Salvo no Disco:');
  console.log(`  • Hash Cena 1 antes da retomada: ${sc1HashBefore.substring(0, 16)}...`);
  console.log(`  • Hash Cena 2 antes da retomada: ${sc2HashBefore.substring(0, 16)}...`);

  console.log('\n[3/3] Retomando Projeto Automaticamente a partir do Checkpoint...');
  const resumedProject = await ProductionPipeline.runProject({
    plan: testPlan,
    profile,
    product,
  });

  const sc1HashAfter = await getFileHash(sc1Path);
  const sc2HashAfter = await getFileHash(sc2Path);

  console.log(`  • Hash Cena 1 após retomada: ${sc1HashAfter.substring(0, 16)}...`);
  console.log(`  • Hash Cena 2 após retomada: ${sc2HashAfter.substring(0, 16)}...`);

  assert.strictEqual(sc1HashBefore, sc1HashAfter, 'Hash da Cena 1 deve ser 100% idêntico');
  assert.strictEqual(sc2HashBefore, sc2HashAfter, 'Hash da Cena 2 deve ser 100% idêntico');
  assert(resumedProject.state === 'COMPLETED', 'Projeto retomado deve ser concluído com sucesso');
  assert(resumedProject.durationSeconds >= 20.0, 'Vídeo retomado deve ter >= 20s');

  console.log('\n====================================================');
  console.log('🎉 TESTE DE RETOMADA TRANSACIONAL CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste de retomada:', err);
  process.exit(1);
});
