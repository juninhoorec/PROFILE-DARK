import { HardwareDetector } from '../hardware/hardware-detector';
import { BaseProvider } from '../interfaces';

export interface RouteDecision {
  chosenProviderId: string;
  tier: 'local_free' | 'free_quota' | 'cheap_api' | 'premium_api';
  estimatedCostUsd: number;
  reason: string;
}

export class CostAwareRouter {
  static decideRoute(
    task: 'image' | 'voice' | 'video' | 'upscale',
    availableProviders: BaseProvider[]
  ): RouteDecision {
    const hw = HardwareDetector.detect();

    // 1. Prefer local free provider if hardware is sufficient or task is lightweight
    const localProvider = availableProviders.find((p) => p.isLocal);
    if (localProvider) {
      if (!localProvider.minVramGb || (hw.vramGb && hw.vramGb >= localProvider.minVramGb) || hw.hardwareProfile === 'LOW') {
        return {
          chosenProviderId: localProvider.id,
          tier: 'local_free',
          estimatedCostUsd: 0,
          reason: 'Execução local gratuita preferida sem consumo de créditos.',
        };
      }
    }

    // 2. Check free quota cloud provider (e.g. Cloudflare AI free quota)
    const freeQuotaProvider = availableProviders.find((p) => p.id.includes('cloudflare') || p.id.includes('free'));
    if (freeQuotaProvider) {
      return {
        chosenProviderId: freeQuotaProvider.id,
        tier: 'free_quota',
        estimatedCostUsd: 0,
        reason: 'Cota gratuita em nuvem configurada e disponível.',
      };
    }

    // 3. Fallback to first available provider
    const fallback = availableProviders[0];
    return {
      chosenProviderId: fallback?.id || 'local-fallback',
      tier: 'local_free',
      estimatedCostUsd: 0,
      reason: 'Motor local otimizado selecionado.',
    };
  }
}
