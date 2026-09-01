import { Product, Profile } from '../../types';

export interface BrollShot {
  id: string;
  type: 'product_macro' | 'product_environment' | 'hands_interaction' | 'result_surface' | 'reaction';
  prompt: string;
  durationSeconds: number;
  voiceoverText: string;
  purpose: string;
}

export class BrollPlanner {
  /**
   * Plans contextual B-roll shots aligned with the script narration, product, and environment.
   */
  static planBrollSequence(params: {
    product: Product;
    profile: Profile;
    context: 'kitchen' | 'skincare' | 'home' | 'tech';
    totalDurationSeconds?: number;
  }): BrollShot[] {
    const { product, profile, context = 'kitchen' } = params;

    const shots: BrollShot[] = [
      {
        id: 'broll-1-product-macro',
        type: 'product_macro',
        prompt: `Macro cinematográfico 9:16 de ${product.name} em foco nítido, iluminação de estúdio quente destacando o acabamento e o rótulo.`,
        durationSeconds: 4,
        voiceoverText: `Olha só o nível de qualidade e acabamento desse ${product.name}.`,
        purpose: 'Apresentar detalhe e desejo visual do produto',
      },
      {
        id: 'broll-2-result-surface',
        type: 'result_surface',
        prompt: `Bancada de ${context === 'kitchen' ? 'cozinha' : 'casa'} brasileira impecável, superfície brilhante com reflexo de luz natural, sem marcas de sujeira.`,
        durationSeconds: 4,
        voiceoverText: 'O resultado fica visível de primeira, sem ter que ficar horas esfregando.',
        purpose: 'Prova visual e transformação rápida',
      },
      {
        id: 'broll-3-environment-context',
        type: 'product_environment',
        prompt: `${product.name} organizado com elegância sobre a bancada ao lado de utensílios do cotidiano, atmosfera acolhedora e autêntica.`,
        durationSeconds: 3,
        voiceoverText: `Combina com qualquer cantinho e facilita demais o dia a dia.`,
        purpose: 'Conectar o produto à vida real do espectador',
      },
    ];

    return shots;
  }
}
