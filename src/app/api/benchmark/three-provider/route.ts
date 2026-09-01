import { NextResponse } from 'next/server';
import { ThreeProvider5sRunner } from '@/lib/ai/benchmark/three-provider-5s-runner';
import { BudgetManager } from '@/lib/ai/financial/budget-manager';

export async function GET() {
  try {
    const rateInfo = await BudgetManager.getExchangeRate();
    const rate = rateInfo.rate;

    const estLtxUsd = 0.10;
    const estVeoUsd = 0.25;
    const estGrokUsd = 0.252;
    const totalEstUsd = 0.602;
    const totalEstBrl = parseFloat((totalEstUsd * rate).toFixed(2));

    return NextResponse.json({
      initialBudgetBrl: BudgetManager.BENCHMARK_MAX_BUDGET_BRL,
      exchangeRateUsdBrl: rate,
      isExchangeEstimated: rateInfo.isEstimated,
      scenes: [
        {
          scene: 1,
          provider: 'fal.ai',
          model: 'fal-ai/ltxv-13b-098-distilled/image-to-video',
          costUsd: estLtxUsd,
          costBrl: parseFloat((estLtxUsd * rate).toFixed(2)),
          duration: 5,
        },
        {
          scene: 2,
          provider: 'Google Gemini',
          model: 'Veo 3.1 Lite (720p)',
          costUsd: estVeoUsd,
          costBrl: parseFloat((estVeoUsd * rate).toFixed(2)),
          duration: 5,
        },
        {
          scene: 3,
          provider: 'xAI',
          model: 'grok-imagine-video (480p)',
          costUsd: estGrokUsd,
          costBrl: parseFloat((estGrokUsd * rate).toFixed(2)),
          duration: 5,
        },
      ],
      totalEstimatedCostUsd: totalEstUsd,
      totalEstimatedCostBrl: totalEstBrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const report = await ThreeProvider5sRunner.runFullBenchmark();
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
