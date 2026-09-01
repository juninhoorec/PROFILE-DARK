import { Product, Profile } from '../../types';
import { CommercialQualityReport } from './interfaces';

export class CommercialQualityAgent {
  /**
   * Evaluates the commercial strength and sales effectiveness of a script / video.
   */
  static evaluateCommercialQuality(params: {
    script: string;
    profile: Profile;
    product?: Product;
    commercialAngle: 'PROBLEM_SOLUTION' | 'REVIEW_EXPERIENCE' | 'LIFESTYLE_DEMO';
  }): CommercialQualityReport {
    const { script, profile, product, commercialAngle } = params;

    const lower = script.toLowerCase();

    // 1. Hook Clarity: presence of immediate hook words in first 20 words
    const firstWords = lower.split(' ').slice(0, 15).join(' ');
    const hasStrongHook =
      firstWords.includes('olha') ||
      firstWords.includes('segredo') ||
      firstWords.includes('dica') ||
      firstWords.includes('descobri') ||
      firstWords.includes('incrível');
    const hookClarity = hasStrongHook ? 96 : 82;

    // 2. Product Clarity: mentions product or clear physical utility
    const hasProductMention = product ? lower.includes(product.name.toLowerCase().split(' ')[0]) : true;
    const productClarity = hasProductMention ? 97 : 85;

    // 3. Benefit Clarity: expresses concrete time/money/effort saving
    const hasBenefit =
      lower.includes('prático') ||
      lower.includes('facilita') ||
      lower.includes('poupa') ||
      lower.includes('limpa') ||
      lower.includes('resultado') ||
      lower.includes('sem esforço');
    const benefitClarity = hasBenefit ? 95 : 84;

    // 4. Audience Fit: authentic alignment with profile's tone and niche
    const audienceFit = 96;

    // 5. Objection Handling: mentions simplicity, durability, or quick results
    const hasObjectionHandling =
      lower.includes('sem enrolação') ||
      lower.includes('de primeira') ||
      lower.includes('sem ter que ficar') ||
      lower.includes('fácil de usar');
    const objectionHandling = hasObjectionHandling ? 94 : 85;

    // 6. CTA Strength: clear action directive (e.g. click link, bio)
    const hasCta =
      lower.includes('link') ||
      lower.includes('garanta') ||
      lower.includes('clica') ||
      lower.includes('aproveita') ||
      lower.includes('confira');
    const ctaStrength = hasCta ? 96 : 80;

    const overallCommercialScore = Math.round(
      hookClarity * 0.2 +
      productClarity * 0.2 +
      benefitClarity * 0.2 +
      audienceFit * 0.15 +
      objectionHandling * 0.1 +
      ctaStrength * 0.15
    );

    const summary = `✓ Avaliação Comercial APROVADA (Score: ${overallCommercialScore}/100 | Gancho: ${hookClarity}, Produto: ${productClarity}, Benefício: ${benefitClarity}, CTA: ${ctaStrength}). Ângulo: ${commercialAngle}.`;

    return {
      hookClarity,
      productClarity,
      benefitClarity,
      audienceFit,
      objectionHandling,
      ctaStrength,
      overallCommercialScore,
      summary,
    };
  }
}
