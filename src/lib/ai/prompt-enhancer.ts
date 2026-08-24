import { Profile, Product, CommercialObjective, RealismLevel } from '../types';

export interface PromptEnhanceResult {
  originalPrompt: string;
  enhancedPrompt: string;
  addedContext: string[];
  visualDirectives: string;
  salesDirectives: string;
  cameraAndLighting: string;
}

export class PromptEnhancer {
  static enhance(params: {
    rawPrompt: string;
    profile?: Profile;
    product?: Product;
    objective?: CommercialObjective;
    realismLevel?: RealismLevel;
  }): PromptEnhanceResult {
    const { rawPrompt, profile, product, objective = 'conversao', realismLevel = 'ultra-realista' } = params;

    const addedContext: string[] = [];
    const profileContext = profile
      ? `Personagem: ${profile.name} (${profile.dna.visualAppearance}), vestindo ${profile.dna.wardrobeStyle}. Tom: ${profile.dna.toneOfVoice}.`
      : 'Personagem realista com textura de pele autêntica e iluminação cinematográfica.';
    
    if (profile) addedContext.push(`Consistência de Personagem (Character Lock: ${profile.name})`);

    let productContext = '';
    if (product) {
      productContext = `Preservação rigorosa de Produto (Product Lock): Exibir "${product.name}" da marca ${product.brand}. Detalhes essenciais: ${product.dna.keyFeatures.join(', ')}. Cores: ${product.dna.colors.join(', ')}.`;
      addedContext.push(`Preservação de Produto (${product.name})`);
    }

    const cameraAndLighting =
      realismLevel === 'ultra-realista'
        ? 'Optics: 85mm portrait lens, f/1.8 shallow depth of field, natural volumetric rim lighting, micro-contrast in skin pores, subsurface scattering on skin, accurate physical shadow falloff, 4K Master Grade.'
        : 'Optics: 50mm lens, natural soft studio lighting, realistic depth of field.';
    
    addedContext.push(`Realismo: ${realismLevel.toUpperCase()} (Óptica 85mm, Subsurface Scattering, F/1.8)`);

    const salesDirectives = `Objetivo Comercial: ${objective.toUpperCase()}. Hook magnético nos primeiros 3 segundos, retenção visual com foco nos benefícios e chamada para ação (CTA) nítida e persuasiva.`;
    addedContext.push(`Gatilho de Conversão (${objective.toUpperCase()})`);

    const enhancedPrompt = [
      `[CINEMATIC COMMERCIAL SHOT]`,
      `Base Concept: ${rawPrompt.trim() || 'Apresentação impactante de produto em ambiente moderno'}`,
      `Character Direction: ${profileContext}`,
      productContext ? `Product Details: ${productContext}` : '',
      `Camera & Aesthetics: ${cameraAndLighting}`,
      `Sales Flow & Framing: ${salesDirectives}`,
      `Negative Directives: (plastic skin:1.5), (uncanny teeth:1.4), (deformed fingers:1.4), (oversaturated:1.2), (fake render:1.3), (low resolution:1.3).`,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      originalPrompt: rawPrompt,
      enhancedPrompt,
      addedContext,
      visualDirectives: profileContext,
      salesDirectives,
      cameraAndLighting,
    };
  }
}
