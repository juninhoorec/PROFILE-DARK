import fs from 'node:fs/promises';
import { strict as assert } from 'node:assert';
import { BudgetManager } from '../src/lib/ai/financial/budget-manager';
import { R5BenchmarkRunner } from '../src/lib/ai/benchmark/r5-benchmark-runner';

console.log('💵 Executando Teste: Benchmark de Vídeo com Orçamento R$ 5,00...\n');

async function run() {
  // Reset budget to clean R$ 5,00 allocation
  await BudgetManager.resetBudget(5.00);

  // 1. Validate Financial Guardrails
  console.log('[1/4] Verificando Regras Financeiras & Hard Cost Gate:');
  const budget = await BudgetManager.getBudgetState();
  console.log(`  • Orçamento Total: R$ ${budget.budgetTotalBrl.toFixed(2)}`);
  console.log(`  • Limite Máximo por Vídeo: R$ ${BudgetManager.MAX_COST_PER_VIDEO_BRL.toFixed(2)}`);
  console.log(`  • Câmbio USD/BRL: R$ ${budget.exchangeRateUsdBrl.toFixed(2)} (${budget.isExchangeEstimated ? 'Estimado' : 'Real'})`);

  const estimate15s = await BudgetManager.estimateCost({ durationSeconds: 15, provider: 'fal-ltx-13b' });
  console.log(`  • Custo Estimado (15s LTX-Video): US$ ${estimate15s.estimatedCostUsd.toFixed(2)} ≈ R$ ${estimate15s.estimatedCostBrl.toFixed(2)}`);
  assert(estimate15s.isWithinHardLimit === true, 'Custo de 15s deve estar dentro do limite de R$ 2,00');

  // Validate Hard Cost Gate blocking oversized request
  const estimateOversized = await BudgetManager.estimateCost({ durationSeconds: 30, provider: 'fal-ltx-13b' });
  console.log(`  • Custo Estimado (30s): R$ ${estimateOversized.estimatedCostBrl.toFixed(2)} (Dentro do limite?: ${estimateOversized.isWithinHardLimit})`);
  assert(estimateOversized.isWithinHardLimit === false, 'Vídeo acima de R$ 2,00 deve ser bloqueado');
  console.log('  ✓ Hard Cost Gate validado com sucesso.\n');

  // 2. Run Benchmark Test
  console.log('[2/4] Executando Benchmark Controlado (Vó Zélia, 15s, LTX-Video 13B Distilled)...');
  process.env.ENABLE_LOCAL_BENCHMARK_SIMULATION = 'true'; // enable local rendering for offline validation if no key
  const report = await R5BenchmarkRunner.runBenchmark({ durationSeconds: 15 });

  console.log(`  ✓ Vídeo gerado em: ${report.artifacts.finalVideoPath}`);
  console.log(`  • Duração: ${report.durationDeliveredSeconds.toFixed(2)}s`);
  console.log(`  • Provider: ${report.provider} (${report.model})`);
  console.log(`  • Custo Medido: US$ ${report.measuredCostUsd.toFixed(2)} ≈ R$ ${report.measuredCostBrl.toFixed(2)}`);
  console.log(`  • Saldo Restante: R$ ${report.remainingBudgetBrl.toFixed(2)}`);
  console.log(`  • Tempo de Geração: ${report.generationTimeSeconds}s\n`);

  // 3. Inspect Keyframes & Contact Sheet
  console.log('[3/4] Validando Contact Sheet (6 keyframes: 0%, 20%, 40%, 60%, 80%, 100%):');
  const sheetExists = await fs.stat(report.artifacts.contactSheetPath);
  assert(sheetExists.size > 0, 'Contact sheet deve existir no disco');
  console.log(`  ✓ Contact sheet validado: ${report.artifacts.contactSheetPath}\n`);

  // 4. Quality Scores & Verdict
  console.log('[4/4] Avaliação de Qualidade & Decisão do Benchmark:');
  console.log(`  • Face Consistency: ${report.quality.faceConsistencyScore}/100`);
  console.log(`  • Motion Naturalness: ${report.quality.motionScore}/100`);
  console.log(`  • Realism & Lighting: ${report.quality.realismScore}/100`);
  console.log(`  • Hands: ${report.quality.handsScore}/100`);
  console.log(`  • Temporal Stability: ${report.quality.temporalStabilityScore}/100`);
  console.log(`  • Nota Geral: ${report.quality.overallScore}/100`);
  console.log(`  • Classificação: ${report.result}`);
  console.log(`  • Decisão: ${report.decisionSummary}`);
  console.log(`  • Próximo Passo Sugerido: ${report.suggestedNextStep}`);

  assert(report.remainingBudgetBrl >= 1.00, 'Saldo restante deve ser >= R$ 1,00 para próximas decisões');
  assert(report.quality.overallScore > 0, 'Nota de qualidade deve ser positiva');

  console.log('\n====================================================');
  console.log('🎉 BENCHMARK R$ 5,00 EXECUTADO COM SUCESSO! ✓');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Falha no benchmark R$ 5,00:', err);
  process.exit(1);
});
