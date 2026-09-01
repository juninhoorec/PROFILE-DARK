import fs from 'node:fs/promises';
import path from 'node:path';

export interface BudgetState {
  budgetTotalBrl: number;
  budgetReservedBrl: number;
  budgetSpentBrl: number;
  budgetRemainingBrl: number;
  exchangeRateUsdBrl: number;
  isExchangeEstimated: boolean;
  autoRecharge: boolean;
  lastUpdated: string;
}

export interface BudgetTransaction {
  id: string;
  projectId?: string;
  type: 'RESERVATION' | 'SETTLEMENT' | 'REFUND';
  amountBrl: number;
  amountUsd: number;
  description: string;
  timestamp: string;
}

export class BudgetManager {
  private static readonly BUDGET_FILE = path.join(process.cwd(), 'data', 'financial', 'benchmark_budget.json');
  public static readonly BENCHMARK_MAX_BUDGET_BRL = 5.00;
  public static readonly MAX_COST_PER_VIDEO_BRL = 2.00;
  public static readonly MAX_COST_PER_RETRY_BRL = 1.00;
  public static readonly AUTO_RECHARGE = false;
  public static readonly DEFAULT_USD_BRL = 5.70;

  /**
   * Retrieves current USD/BRL exchange rate.
   */
  static async getExchangeRate(): Promise<{ rate: number; isEstimated: boolean }> {
    const envRate = process.env.USD_BRL_RATE ? parseFloat(process.env.USD_BRL_RATE) : null;
    if (envRate && !isNaN(envRate)) {
      return { rate: envRate, isEstimated: false };
    }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.rates?.BRL) {
          return { rate: parseFloat(data.rates.BRL.toFixed(4)), isEstimated: false };
        }
      }
    } catch {
      // Offline fallback
    }

    return { rate: this.DEFAULT_USD_BRL, isEstimated: true };
  }

  /**
   * Resets budget state to fresh initial allocation (e.g. for benchmark runs).
   */
  static async resetBudget(totalBrl = this.BENCHMARK_MAX_BUDGET_BRL): Promise<BudgetState> {
    const rateInfo = await this.getExchangeRate();
    const fresh: BudgetState = {
      budgetTotalBrl: totalBrl,
      budgetReservedBrl: 0,
      budgetSpentBrl: 0,
      budgetRemainingBrl: totalBrl,
      exchangeRateUsdBrl: rateInfo.rate,
      isExchangeEstimated: rateInfo.isEstimated,
      autoRecharge: this.AUTO_RECHARGE,
      lastUpdated: new Date().toISOString(),
    };
    await this.saveBudgetState(fresh);
    return fresh;
  }

  /**
   * Loads current budget state from disk or initializes defaults.
   */
  static async getBudgetState(): Promise<BudgetState> {
    try {
      const data = await fs.readFile(this.BUDGET_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      const rateInfo = await this.getExchangeRate();
      const initial: BudgetState = {
        budgetTotalBrl: this.BENCHMARK_MAX_BUDGET_BRL,
        budgetReservedBrl: 0,
        budgetSpentBrl: 0,
        budgetRemainingBrl: this.BENCHMARK_MAX_BUDGET_BRL,
        exchangeRateUsdBrl: rateInfo.rate,
        isExchangeEstimated: rateInfo.isEstimated,
        autoRecharge: this.AUTO_RECHARGE,
        lastUpdated: new Date().toISOString(),
      };
      await this.saveBudgetState(initial);
      return initial;
    }
  }

  /**
   * Saves budget state to disk.
   */
  private static async saveBudgetState(state: BudgetState): Promise<void> {
    await fs.mkdir(path.dirname(this.BUDGET_FILE), { recursive: true });
    await fs.writeFile(this.BUDGET_FILE, JSON.stringify(state, null, 2), 'utf8');
  }

  /**
   * Estimates video generation cost in USD and BRL.
   */
  static async estimateCost(params: {
    durationSeconds: number;
    provider: 'fal-ltx-13b' | 'wan-25';
  }): Promise<{
    durationSeconds: number;
    estimatedCostUsd: number;
    estimatedCostBrl: number;
    exchangeRate: number;
    isEstimatedExchange: boolean;
    isWithinHardLimit: boolean;
    errorMessage?: string;
  }> {
    const { durationSeconds, provider } = params;
    const rateInfo = await this.getExchangeRate();

    // LTX-Video 13B Distilled is ~$0.02/sec
    const costPerSecondUsd = provider === 'fal-ltx-13b' ? 0.02 : 0.04;
    const estimatedCostUsd = parseFloat((durationSeconds * costPerSecondUsd).toFixed(4));
    const estimatedCostBrl = parseFloat((estimatedCostUsd * rateInfo.rate).toFixed(2));

    const isWithinHardLimit = estimatedCostBrl <= this.MAX_COST_PER_VIDEO_BRL;
    const errorMessage = isWithinHardLimit
      ? undefined
      : `Este teste ultrapassa o limite inicial de R$${this.MAX_COST_PER_VIDEO_BRL.toFixed(2)} por vídeo (Estimado: R$${estimatedCostBrl.toFixed(2)}).`;

    return {
      durationSeconds,
      estimatedCostUsd,
      estimatedCostBrl,
      exchangeRate: rateInfo.rate,
      isEstimatedExchange: rateInfo.isEstimated,
      isWithinHardLimit,
      errorMessage,
    };
  }

  /**
   * Reserves budget for a video test run under Hard Cost Gate rules.
   */
  static async reserveBudget(params: {
    projectId: string;
    amountBrl: number;
    amountUsd: number;
  }): Promise<{ success: boolean; state: BudgetState; error?: string }> {
    const { projectId, amountBrl, amountUsd } = params;
    const state = await this.getBudgetState();

    if (amountBrl > this.MAX_COST_PER_VIDEO_BRL) {
      return {
        success: false,
        state,
        error: `Este teste ultrapassa o limite inicial de R$${this.MAX_COST_PER_VIDEO_BRL.toFixed(2)} por vídeo.`,
      };
    }

    if (state.budgetRemainingBrl - amountBrl < 0) {
      return {
        success: false,
        state,
        error: `Saldo insuficiente para o benchmark (Disponível: R$${state.budgetRemainingBrl.toFixed(2)}, Requerido: R$${amountBrl.toFixed(2)}).`,
      };
    }

    state.budgetReservedBrl = parseFloat((state.budgetReservedBrl + amountBrl).toFixed(2));
    state.budgetRemainingBrl = parseFloat((state.budgetTotalBrl - state.budgetSpentBrl - state.budgetReservedBrl).toFixed(2));
    state.lastUpdated = new Date().toISOString();

    await this.saveBudgetState(state);
    return { success: true, state };
  }

  /**
   * Settles measured cost after completion.
   */
  static async settleBudget(params: {
    projectId: string;
    reservedBrl: number;
    measuredCostBrl: number;
    measuredCostUsd: number;
  }): Promise<BudgetState> {
    const { reservedBrl, measuredCostBrl } = params;
    const state = await this.getBudgetState();

    state.budgetReservedBrl = Math.max(0, parseFloat((state.budgetReservedBrl - reservedBrl).toFixed(2)));
    state.budgetSpentBrl = parseFloat((state.budgetSpentBrl + measuredCostBrl).toFixed(2));
    state.budgetRemainingBrl = parseFloat((state.budgetTotalBrl - state.budgetSpentBrl - state.budgetReservedBrl).toFixed(2));
    state.lastUpdated = new Date().toISOString();

    await this.saveBudgetState(state);
    return state;
  }
}
