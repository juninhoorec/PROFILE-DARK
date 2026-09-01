import { strict as assert } from 'node:assert';
import { db } from '../src/lib/storage/db';
import { CampaignManager } from '../src/lib/ai/production/campaign-manager';

console.log('🏛️ Executando Teste: Gestão e Persistência de Campanha...\n');

async function run() {
  const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
  const product = db.getProducts()[0];

  console.log(`- Profile: ${profile.name}`);
  console.log(`- Produto: ${product.name}\n`);

  console.log('[1/2] Criando e Executando Campanha com 3 Vídeos...');
  const campaign = await CampaignManager.createAndExecuteCampaign({
    title: `Campanha de Lançamento — ${product.name}`,
    profile,
    product,
    affiliateUrl: 'https://shopee.com.br/product/12345/67890',
    qualityTier: 'balanced',
  });

  console.log(`  ✓ Campanha criada com ID: ${campaign.id}`);
  console.log(`  • Status: ${campaign.status}`);
  console.log(`  • Total de Projetos de Vídeo: ${campaign.videoProjects.length}`);
  console.log(`  • Duração Total de Conteúdo Gerado: ${campaign.totalGenerationSeconds.toFixed(2)}s\n`);

  assert(Boolean(campaign.id), 'Campanha deve possuir ID único');
  assert(campaign.videoProjects.length === 3, 'Campanha deve conter 3 projetos de vídeo');
  assert(campaign.status === 'COMPLETED', 'Status da campanha deve ser COMPLETED');

  console.log('[2/2] Recarregando Campanha do Disco...');
  const reloaded = await CampaignManager.getCampaign(campaign.id);
  assert(Boolean(reloaded), 'Campanha deve ser recarregada do disco');
  assert(reloaded?.id === campaign.id, 'IDs devem coincidir após recarga');
  assert(reloaded?.videoProjects.length === 3, 'Projetos devem permanecer persistidos');
  console.log('  ✓ Campanha recarregada com sucesso e 100% persistida no disco.');

  console.log('\n====================================================');
  console.log('🎉 TESTE DE CAMPANHA CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste de campanha:', err);
  process.exit(1);
});
