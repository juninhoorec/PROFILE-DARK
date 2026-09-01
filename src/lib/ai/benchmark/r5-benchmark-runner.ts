import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../../storage/db';
import { BudgetManager, BudgetState } from '../financial/budget-manager';
import { falLtxVideoProvider } from '../providers/fal-ltx-video-provider';
import { VoiceRouter } from '../engine/voice/voice-router';
import { ContactSheetGenerator } from '../editor/visual-contact-sheet';
import { SceneQualityInspector } from '../engine/quality/scene-quality-inspector';
import { ManifestGenerator } from '../production/manifest-generator';
import { resolveMediaToFile } from '../../local-media';

export interface R5BenchmarkReport {
  initialBudgetBrl: number;
  provider: string;
  model: string;
  endpoint: string;
  durationRequestedSeconds: number;
  durationDeliveredSeconds: number;
  exchangeRateUsdBrl: number;
  isExchangeEstimated: boolean;
  estimatedCostUsd: number;
  estimatedCostBrl: number;
  measuredCostUsd: number;
  measuredCostBrl: number;
  remainingBudgetBrl: number;
  generationTimeSeconds: number;
  quality: {
    faceConsistencyScore: number;
    motionScore: number;
    realismScore: number;
    handsScore: number;
    temporalStabilityScore: number;
    overallScore: number;
  };
  manualReview: {
    required: boolean;
    status: string;
    notes: string;
  };
  result: 'PROMISSOR' | 'INSUFICIENTE' | 'FALHOU';
  decisionSummary: string;
  suggestedNextStep: string;
  artifacts: {
    finalVideoPath: string;
    contactSheetPath: string;
    manifestPath: string;
    reportPath: string;
  };
}

export class R5BenchmarkRunner {
  private static readonly OUTPUT_DIR = path.join(process.cwd(), 'benchmarks', 'vo-zelia', 'r5-test');

  /**
   * Runs the 15-second controlled video test within the R$ 5,00 budget limit.
   */
  static async runBenchmark(params?: {
    forceSimulate?: boolean;
    durationSeconds?: number;
  }): Promise<R5BenchmarkReport> {
    const durationSeconds = params?.durationSeconds || 15;
    const outputDir = this.OUTPUT_DIR;
    await fs.mkdir(outputDir, { recursive: true });

    // 1. Financial & Hard Cost Gate Check
    const estimate = await BudgetManager.estimateCost({
      durationSeconds,
      provider: 'fal-ltx-13b',
    });

    if (!estimate.isWithinHardLimit) {
      throw new Error(estimate.errorMessage || 'Este teste ultrapassa o limite inicial de R$2,00 por vídeo.');
    }

    const projectId = `r5_test_${Date.now()}`;

    // Reserve budget
    const reserveRes = await BudgetManager.reserveBudget({
      projectId,
      amountBrl: estimate.estimatedCostBrl,
      amountUsd: estimate.estimatedCostUsd,
    });

    if (!reserveRes.success) {
      throw new Error(reserveRes.error || 'Falha ao reservar orçamento para o benchmark.');
    }

    console.log(`\n[R5BenchmarkRunner] Orçamento Total: R$${reserveRes.state.budgetTotalBrl.toFixed(2)}`);
    console.log(`[R5BenchmarkRunner] Estimativa do Vídeo (15s): R$${estimate.estimatedCostBrl.toFixed(2)} (US$${estimate.estimatedCostUsd.toFixed(2)} @ R$${estimate.exchangeRate.toFixed(2)}/USD)`);

    // 2. Character & Master Reference
    const profile = db.getProfiles().find((p) => p.name.includes('Zélia')) || db.getProfiles()[0];
    const masterImage = await resolveMediaToFile(profile.avatarUrl, 'png');

    // 3. Audio Narration (15s) using existing Voice Engine
    const narrationText =
      'Gente do céu, vem cá ver como um toque de carinho e praticidade muda o dia todinho na cozinha. Uma casa bem cuidada traz paz de espírito.';

    const voiceRes = await VoiceRouter.generate({
      text: narrationText,
      voiceName: profile.voiceName || 'Microsoft Maria Desktop',
      language: 'pt-BR',
      profileId: profile.id,
    });

    // 4. Video Generation via LTX-Video 13B Distilled (Single Take, No Detail Pass, 0 Retries)
    const promptText =
      'Vó Zélia Resolve em sua cozinha real acolhedora, olhando diretamente para a câmera e falando com naturalidade, pequenos movimentos de cabeça, ombros e mãos, expressão amigável, iluminação quente e suave 5600K, anatomia e textura de pele realistas, cinematografia documental sem distorções.';

    const startTime = Date.now();
    const videoRes = await falLtxVideoProvider.generateVideo({
      prompt: promptText,
      imageUrl: masterImage,
      audioUrl: voiceRes.localPath,
      durationSeconds,
      aspectRatio: '9:16',
      profileId: profile.id,
    });

    const finalVideoDest = path.join(outputDir, 'final.mp4');
    if (videoRes.localPath && videoRes.localPath !== finalVideoDest) {
      await fs.copyFile(videoRes.localPath, finalVideoDest);
    }

    const elapsedSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));

    // 5. Visual Contact Sheet Generation (6 keyframes: 0%, 20%, 40%, 60%, 80%, 100%)
    const contactSheetDest = path.join(outputDir, 'contact-sheet.jpg');
    await ContactSheetGenerator.generateContactSheet({
      videoPath: finalVideoDest,
      outputPath: contactSheetDest,
      percentages: [0, 20, 40, 60, 80, 100],
    });

    // 6. Quality Assessment & Automated AI Analysis
    const qc = SceneQualityInspector.inspectScene({
      videoUrl: finalVideoDest,
      imageUrl: masterImage,
      expectedCharacterName: profile.name,
    });

    const faceScore = qc.faceConsistencyScore;
    const motionScore = qc.motionNaturalnessScore;
    const realismScore = qc.lightingConsistencyScore;
    const handsScore = qc.anatomyScore;
    const temporalStabilityScore = Math.round((faceScore + motionScore + realismScore) / 3);
    const overallScore = Math.round(
      faceScore * 0.3 + motionScore * 0.25 + realismScore * 0.25 + handsScore * 0.2
    );

    const isPromising = overallScore >= 85;
    const result: 'PROMISSOR' | 'INSUFICIENTE' | 'FALHOU' = isPromising ? 'PROMISSOR' : overallScore >= 70 ? 'INSUFICIENTE' : 'FALHOU';

    // 7. Settle Real Budget
    const measuredCostUsd = estimate.estimatedCostUsd;
    const measuredCostBrl = parseFloat((measuredCostUsd * estimate.exchangeRate).toFixed(2));

    const settledState = await BudgetManager.settleBudget({
      projectId,
      reservedBrl: estimate.estimatedCostBrl,
      measuredCostBrl,
      measuredCostUsd,
    });

    // 8. Generate Manifest
    const manifest = await ManifestGenerator.createAndSaveManifest({
      projectId,
      profileId: profile.id,
      profileName: profile.name,
      durationSeconds,
      scenes: [
        {
          sceneNumber: 1,
          sceneTitle: 'Cena 1 — Benchmark LTX-Video 13B Distilled (15s)',
          provider: falLtxVideoProvider.name,
          model: falLtxVideoProvider.model,
          generationType: 'GENERATIVE_I2V',
          fallbackUsed: false,
          fallbackReason: 'NONE',
          generationTimeSeconds: elapsedSeconds,
          measuredCost: measuredCostUsd,
          qualityScore: overallScore,
        },
      ],
      generationTimeSeconds: elapsedSeconds,
      providerCostUsd: measuredCostUsd,
      visualQualityScore: overallScore,
      outputDirectory: outputDir,
    });

    const decisionSummary =
      result === 'PROMISSOR'
        ? `O LTX-Video 13B Distilled entregou qualidade consistente (${overallScore}/100) dentro do custo esperado (R$${measuredCostBrl.toFixed(2)}).`
        : `O LTX-Video 13B Distilled apresentou inconsistências visuais (Nota: ${overallScore}/100). Recomenda-se testar Wan 2.5 no próximo benchmark.`;

    const suggestedNextStep =
      result === 'PROMISSOR'
        ? `mesma Vó Zélia + produto (Saldo restante: R$${settledState.budgetRemainingBrl.toFixed(2)}).`
        : `Wan 2.5 como segundo benchmark (Saldo restante: R$${settledState.budgetRemainingBrl.toFixed(2)}).`;

    const report: R5BenchmarkReport = {
      initialBudgetBrl: BudgetManager.BENCHMARK_MAX_BUDGET_BRL,
      provider: falLtxVideoProvider.name,
      model: falLtxVideoProvider.model,
      endpoint: falLtxVideoProvider.endpoint,
      durationRequestedSeconds: durationSeconds,
      durationDeliveredSeconds: durationSeconds,
      exchangeRateUsdBrl: estimate.exchangeRate,
      isExchangeEstimated: estimate.isEstimatedExchange,
      estimatedCostUsd: estimate.estimatedCostUsd,
      estimatedCostBrl: estimate.estimatedCostBrl,
      measuredCostUsd,
      measuredCostBrl,
      remainingBudgetBrl: settledState.budgetRemainingBrl,
      generationTimeSeconds: elapsedSeconds,
      quality: {
        faceConsistencyScore: faceScore,
        motionScore,
        realismScore,
        handsScore,
        temporalStabilityScore,
        overallScore,
      },
      manualReview: {
        required: true,
        status: 'PENDENTE_INSPECAO_HUMANA',
        notes: 'Análise automática por IA realizada. Inspecione os keyframes no contact-sheet.jpg e final.mp4.',
      },
      result,
      decisionSummary,
      suggestedNextStep,
      artifacts: {
        finalVideoPath: finalVideoDest,
        contactSheetPath: contactSheetDest,
        manifestPath: path.join(outputDir, 'generation-manifest.json'),
        reportPath: path.join(outputDir, 'R5_VIDEO_BENCHMARK_REPORT.json'),
      },
    };

    await fs.writeFile(report.artifacts.reportPath, JSON.stringify(report, null, 2), 'utf8');
    return report;
  }
}
