import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { BatchCreativeDirector } from '../src/lib/ai/production/batch-creative-director';
import { ProductionPipeline } from '../src/lib/ai/production/production-pipeline';

console.log('📦 Executando Teste: Batch de 3 Vídeos Comerciais (3 Ângulos Distintos)...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile: ${profile.name}`);
  console.log(`- Produto: ${product.name}\n`);

  const batchStartTime = Date.now();

  // 1. Generate 3 Diverse Creative Plans
  console.log('[1/4] Gerando 3 Planos Criativos Distintos...');
  const batchPlans = BatchCreativeDirector.generateBatchPlans({ profile, product });

  console.log(`  • Diversidade Estrutural: ${batchPlans.antiDuplicationScore}%`);
  console.log(`  • Ângulo A: ${batchPlans.plans[0].commercialAngle}`);
  console.log(`  • Ângulo B: ${batchPlans.plans[1].commercialAngle}`);
  console.log(`  • Ângulo C: ${batchPlans.plans[2].commercialAngle}\n`);

  assert(batchPlans.isDiversityApproved === true, 'Planos devem ser aprovados em diversidade estrutural');
  assert(batchPlans.plans.length === 3, 'Devem ser gerados exatamente 3 planos');

  // 2. Execute Video Projects
  const completedProjects = [];
  for (let i = 0; i < batchPlans.plans.length; i++) {
    const plan = batchPlans.plans[i];
    console.log(`[${i + 2}/4] Produzindo Vídeo ${i + 1}/3: ${plan.commercialAngle}...`);
    const projStartTime = Date.now();

    const project = await ProductionPipeline.runProject({
      plan,
      profile,
      product,
      qualityTier: 'balanced',
    });

    const projElapsed = ((Date.now() - projStartTime) / 1000).toFixed(1);
    console.log(`  ✓ Vídeo ${i + 1} Concluído em ${projElapsed}s (Duração: ${project.durationSeconds.toFixed(2)}s, Visual: ${project.visualQualityScore}, Comercial: ${project.commercialQualityScore})`);

    assert(project.durationSeconds >= 20.0, `Vídeo ${i + 1} deve ter duração >= 20s`);
    assert(project.state === 'COMPLETED', `Vídeo ${i + 1} deve estar em estado COMPLETED`);
    completedProjects.push(project);
  }

  const totalBatchSec = ((Date.now() - batchStartTime) / 1000).toFixed(1);

  console.log('\n----------------------------------------------------');
  console.log(`🎉 BATCH CONCLUÍDO: 3 Vídeos de Alta Qualidade Produzidos!`);
  console.log(`Tempo Total do Batch: ${totalBatchSec}s`);
  console.log('----------------------------------------------------\n');
}

run().catch((err) => {
  console.error('Falha no teste de batch:', err);
  process.exit(1);
});
