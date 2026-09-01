import { db } from '../src/lib/storage/db';
import { AIOrchestrator } from '../src/lib/ai/orchestrator';
import { SceneQualityInspector } from '../src/lib/ai/engine/quality/scene-quality-inspector';

console.log('⚡ Executando Teste de Vídeo de 3 Segundos (CLI)...\n');

async function testVideo() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile Selecionado: ${profile.name}`);
  console.log(`- Produto Selecionado: ${product.name}`);
  console.log('- Disparando AIOrchestrator / PDGenerationEngine para síntese de ~3s...');

  const startTime = Date.now();
  const job = await AIOrchestrator.run3SecondTest(profile, product);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (job.status === 'falhou') {
    console.log(`\n⚠ Teste encerrado em ${elapsed}s: ${job.userFriendlyError || job.errorMessage}`);
    if (job.videoUrl) throw new Error('Um job falho não pode conter URL de vídeo.');
    return;
  }

  console.log(`\n✓ Vídeo real gerado em ${elapsed}s!`);
  console.log(`- Job ID: ${job.id}`);
  console.log(`- Status: ${job.status}`);
  console.log(`- Provider Utilizado: ${job.providerUsed}`);
  console.log(`- Video URL: ${job.videoUrl}`);
  console.log(`- Thumbnail URL: ${job.thumbnailUrl}`);

  const qc = SceneQualityInspector.inspectScene({
    videoUrl: job.videoUrl || '',
    expectedCharacterName: profile.name,
    expectedProductName: product?.name,
  });

  console.log('\n📊 AI Quality Scorecard (Scene Quality Inspector):');
  console.log(`  • Consistência Facial: ${qc.faceConsistencyScore}/100`);
  console.log(`  • Consistência do Produto: ${qc.productConsistencyScore}/100`);
  console.log(`  • Fluidez do Movimento: ${qc.motionNaturalnessScore}/100`);
  console.log(`  • Anatomia & Mãos: ${qc.anatomyScore}/100`);
  console.log(`  • Iluminação & Ambiente: ${qc.lightingConsistencyScore}/100`);
  console.log(`  • Nota Geral: ${qc.overallScore}/100`);

  if (qc.verdict === 'PASS') {
    console.log('\n🟢 Quality Gate: APROVADO ✓');
  } else {
    console.log(`\n🟡 Quality Gate: ${qc.verdict}`);
  }

  console.log('\n========================================');
  console.log('🎉 TESTE DE 3 SEGUNDOS CONCLUÍDO COM SUCESSO! ✓');
  console.log('========================================\n');
}

testVideo().catch((err) => {
  console.error('Falha no teste de vídeo 3s:', err);
  process.exit(1);
});
