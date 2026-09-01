import fs from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import { ThreeProvider5sRunner } from '../src/lib/ai/benchmark/three-provider-5s-runner';
import { BudgetManager } from '../src/lib/ai/financial/budget-manager';

console.log('🎥 Executando Teste: Benchmark Real de 3 Cenas × 5s (3 Providers)...\n');

async function run() {
  process.env.ENABLE_LOCAL_BENCHMARK_SIMULATION = 'true';

  const report = await ThreeProvider5sRunner.runFullBenchmark();

  console.log('\n======================================================');
  console.log('📊 RESULTADOS DO BENCHMARK 3 PROVIDERS (15s):');
  console.log('======================================================');
  console.log(`• Custo Total Estimado: US$ ${report.totalEstimatedCostUsd.toFixed(3)} ≈ R$ ${report.totalEstimatedCostBrl.toFixed(2)}`);
  console.log(`• Saldo Restante: R$ ${report.remainingBudgetBrl.toFixed(2)}`);
  console.log(`• Cenas Concluídas: ${report.scenes.length}/3`);
  console.log(`• Vídeo Final Gerado: ${report.finalArtifacts.finalVideoPath}`);
  console.log(`• Contact Sheet Final: ${report.finalArtifacts.finalContactSheetPath}`);
  console.log(`• Decisão: ${report.decisionSummary}`);
  console.log(`• Próximo Passo: ${report.suggestedNextStep}`);
  console.log('======================================================\n');

  // Assertions
  assert(report.scenes.length === 3, 'Devem ser geradas exatamente 3 cenas');
  assert(report.totalEstimatedCostBrl <= 5.0, 'Custo total deve ser <= R$ 5,00');
  assert(report.comparison.finalVideoPossible === true, 'Concatenação final deve ser possível');

  // Check files on disk
  const finalVidStat = await fs.stat(report.finalArtifacts.finalVideoPath);
  assert(finalVidStat.size > 0, 'Vídeo final de 15s deve existir no disco');

  const finalSheetStat = await fs.stat(report.finalArtifacts.finalContactSheetPath);
  assert(finalSheetStat.size > 0, 'Contact sheet final deve existir no disco');

  console.log('🎉 BENCHMARK 3 CENAS × 5s CONCLUÍDO E VALIDADO COM SUCESSO! ✓\n');
}

run().catch((err) => {
  console.error('Falha no benchmark 3 providers:', err);
  process.exit(1);
});
