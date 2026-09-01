import { strict as assert } from 'node:assert';
import { SmartVideoRouter } from '../src/lib/ai/engine/video/video-router';

console.log('🛡️ Executando Teste: Política Estrita de Fallback (FAST vs MAXIMUM)...\n');

async function run() {
  console.log('[Caso 1] Roteamento no modo FAST (preview tier):');
  const fastProvider = await SmartVideoRouter.selectProvider('character_talking', 'preview');
  console.log(`  • Provider Selecionado: ${fastProvider.name}`);
  console.log(`  • Level: ${fastProvider.providerLevel}`);
  console.log(`  • Quality Tier: ${fastProvider.qualityTier}`);
  assert(fastProvider.providerLevel === 'LEVEL_1_TALKING_AVATAR_2D', 'Modo FAST deve usar Nível 1');
  console.log('  ✓ Modo FAST seleciona local synthesizer conforme permitido.\n');

  console.log('[Caso 2] Roteamento no modo MAXIMUM sem GPU remota conectada:');
  let blockedCorrectly = false;
  try {
    // Force maximum with remote GPU offline
    const maxProvider = await SmartVideoRouter.selectProvider('character_talking', 'maximum');
    console.log(`  • Provider Selecionado em MAXIMUM: ${maxProvider.name}`);
  } catch (err: any) {
    console.log(`  ✓ Bloqueio estrito acionado: "${err.message}"`);
    blockedCorrectly = true;
  }

  assert(blockedCorrectly === true, 'Modo MAXIMUM deve bloquear substituição 2D silenciosa');
  console.log('  ✓ Modo MAXIMUM proíbe fallback 2D silencioso.\n');

  console.log('====================================================');
  console.log('🎉 TESTE DE POLÍTICA DE FALLBACK CONCLUÍDO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no teste de fallback:', err);
  process.exit(1);
});
