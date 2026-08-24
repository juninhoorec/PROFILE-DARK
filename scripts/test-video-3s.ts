import { db } from '../src/lib/storage/db';
import { AIOrchestrator } from '../src/lib/ai/orchestrator';
import { VisualInspector } from '../src/lib/ai/visual-inspector';

console.log('⚡ Executando Teste de Vídeo de 3 Segundos (CLI)...\n');

async function testVideo() {
  const profile = db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile Selecionado: ${profile.name}`);
  console.log(`- Produto Selecionado: ${product.name}`);
  console.log('- Disparando SmartProviderRouter para síntese de ~3s...');

  const startTime = Date.now();
  const job = await AIOrchestrator.run3SecondTest(profile, product);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✓ Vídeo gerado em ${elapsed}s!`);
  console.log(`- Job ID: ${job.id}`);
  console.log(`- Status: ${job.status}`);
  console.log(`- Provider Utilizado: ${job.providerUsed}`);
  console.log(`- Video URL: ${job.videoUrl}`);
  console.log(`- Thumbnail URL: ${job.thumbnailUrl}`);

  const qc = VisualInspector.inspect(job);
  console.log('\n📊 AI Quality Scorecard:');
  console.log(`  • Realismo: ${qc.metrics.realism}/100`);
  console.log(`  • Identidade: ${qc.metrics.identity}/100`);
  console.log(`  • Produto: ${qc.metrics.product}/100`);
  console.log(`  • Movimento: ${qc.metrics.motion}/100`);
  console.log(`  • Qualidade Geral: ${qc.metrics.overallQuality}/100`);

  if (qc.details.issues.length === 0) {
    console.log('\n🟢 Quality Gate: APROVADO ✓');
  } else {
    console.log('\n🟡 Quality Gate: REVISÃO SUGERIDA');
    console.log(`  Aviso: ${qc.details.issues.join(', ')}`);
  }
}

testVideo();
