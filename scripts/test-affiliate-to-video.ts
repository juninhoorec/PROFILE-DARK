import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { ProfileProductMatcher } from '../src/lib/affiliate/profile-product-matcher';
import { ProductionPipeline } from '../src/lib/ai/production/production-pipeline';
import { BatchCreativeDirector } from '../src/lib/ai/production/batch-creative-director';

console.log('🛍️ Executando Teste: Affiliate Platform → Agent Editor Pipeline...\n');

async function run() {
  const product = db.getProducts()[0];
  console.log(`[1/4] Consumindo Produto da Plataforma de Afiliados:`);
  console.log(`  • Nome: ${product.name}`);
  console.log(`  • Categoria: ${product.category}`);
  console.log(`  • Preço: ${product.price}\n`);

  console.log('[2/4] Matcher de Profiles Contextuais:');
  const suggestions = ProfileProductMatcher.suggest(product.dna);
  console.log(`  • Sugestões de Profile encontradas: ${suggestions.length}`);
  const selectedProfile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  console.log(`  • Profile Selecionado: ${selectedProfile.name} (${selectedProfile.niche})\n`);

  console.log('[3/4] Gerando Estratégia Criativa a partir do DNA do Produto...');
  const batchPlans = BatchCreativeDirector.generateBatchPlans({
    profile: selectedProfile,
    product,
  });
  const chosenPlan = batchPlans.plans[0];
  console.log(`  • Roteiro: "${chosenPlan.title}"`);
  console.log(`  • Cenas Planejadas: ${chosenPlan.scenes.length}\n`);

  console.log('[4/4] Produzindo Vídeo Comercial Final...');
  const project = await ProductionPipeline.runProject({
    plan: chosenPlan,
    profile: selectedProfile,
    product,
    qualityTier: 'balanced',
  });

  console.log(`  ✓ Vídeo gerado em: ${project.finalVideoPath}`);
  console.log(`  • Duração: ${project.durationSeconds.toFixed(2)}s`);
  console.log(`  • Visual Quality: ${project.visualQualityScore}/100`);
  console.log(`  • Commercial Quality: ${project.commercialQualityScore}/100`);
  console.log(`  • Legenda para Redes Sociais: "${project.socialCaption?.caption.substring(0, 60)}..."`);
  console.log(`  • CTA Text: "${project.socialCaption?.ctaText}"`);

  assert(project.durationSeconds >= 20.0, 'Duração deve ser >= 20s');
  assert(Boolean(project.manifest), 'Manifesto de geração deve existir');
  assert(Boolean(project.socialCaption), 'Legenda de redes sociais deve ser gerada');

  console.log('\n====================================================');
  console.log('🎉 TESTE AFFILIATE → VIDEO CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste affiliate-to-video:', err);
  process.exit(1);
});
