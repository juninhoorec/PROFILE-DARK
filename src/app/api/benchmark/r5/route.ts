import { NextResponse } from 'next/server';
import { BudgetManager } from '@/lib/ai/financial/budget-manager';
import { R5BenchmarkRunner } from '@/lib/ai/benchmark/r5-benchmark-runner';

export async function GET() {
  try {
    const budget = await BudgetManager.getBudgetState();
    const estimate = await BudgetManager.estimateCost({ durationSeconds: 15, provider: 'fal-ltx-13b' });

    return NextResponse.json({
      budgetTotalBrl: budget.budgetTotalBrl,
      budgetSpentBrl: budget.budgetSpentBrl,
      budgetReservedBrl: budget.budgetReservedBrl,
      budgetRemainingBrl: budget.budgetRemainingBrl,
      exchangeRateUsdBrl: budget.exchangeRateUsdBrl,
      isExchangeEstimated: budget.isExchangeEstimated,
      maxCostPerVideoBrl: BudgetManager.MAX_COST_PER_VIDEO_BRL,
      estimatedCostUsd: estimate.estimatedCostUsd,
      estimatedCostBrl: estimate.estimatedCostBrl,
      provider: 'fal-ltx-13b-distilled',
      model: 'ltxv-13b-098-distilled',
      endpoint: 'fal-ai/ltxv-13b-098-distilled/image-to-video',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const durationSeconds = body.durationSeconds || 15;

    const report = await R5BenchmarkRunner.runBenchmark({ durationSeconds });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
