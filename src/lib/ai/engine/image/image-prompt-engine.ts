import { Product, Profile, ProfileDNA, RealismLevel } from '../../../types';

export interface PromptEngineOptions {
  userPrompt: string;
  profile?: Profile;
  product?: Product;
  realismLevel?: RealismLevel;
  shotType?: 'portrait' | 'full_body' | 'product_interaction' | 'environment' | 'talking_head';
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export interface PromptEngineOutput {
  masterPrompt: string;
  negativePrompt: string;
  technicalDirectives: string[];
  recommendedSeed: number;
}

export class ImagePromptEngine {
  static buildPrompt(options: PromptEngineOptions): PromptEngineOutput {
    const {
      userPrompt,
      profile,
      product,
      realismLevel = 'ultra-realista',
      shotType = 'portrait',
      aspectRatio = '9:16',
    } = options;

    const dna = profile?.dna;
    const name = dna?.name || profile?.name || 'Brazilian Character';
    const age = dna?.ageApparent || 35;
    const appearance = dna?.visualAppearance || 'natural Brazilian facial features, authentic skin texture';
    const wardrobe = dna?.wardrobeStyle || 'authentic contemporary casual attire with natural fabric folds';
    const environment = dna?.environmentPreference || 'modern realistic environment with soft natural lighting';
    const niche = dna?.niche || 'Lifestyle';

    // Core subject description
    const subjectTokens: string[] = [
      `Photographic cinematic portrait of ${name}`,
      `${age} years old`,
      appearance,
      `wearing ${wardrobe}`,
      `set in ${environment}`,
    ];

    // Interaction with product if available
    if (product) {
      subjectTokens.push(
        `holding and showcasing ${product.name} by ${product.brand}`,
        `natural hand grip, fingers properly wrapped around the packaging with realistic contact shadows`,
        `product details crisp and readable: ${product.dna?.keyFeatures?.slice(0, 2).join(', ') || ''}`
      );
    }

    // Context from user prompt
    if (userPrompt.trim()) {
      subjectTokens.push(`Action & Context: ${userPrompt.trim()}`);
    }

    // Realism tokens (Spec 12)
    const realismTokens = [
      'authentic skin microtexture with visible fine pores and natural subsurface scattering',
      'subtle age details and natural skin imperfections',
      'realistic individual hair strands with natural flyaways',
      'anatomically accurate hands and fingers with realistic fingernails and knuckles',
      'natural eye reflections and catchlights with optical depth',
      'physically plausible lighting with soft contact shadows and realistic bounce light',
      'real-world materials and authentic fabric folds',
      'slight natural facial asymmetry',
    ];

    // Camera and optics specifications
    const cameraTokens = [
      aspectRatio === '9:16' ? 'vertical 9:16 commercial format' : 'commercial photograph',
      shotType === 'full_body' ? '50mm prime lens, f/2.8 aperture, full body framing' : '85mm portrait lens, f/1.8 aperture, shallow optical depth of field with creamy natural bokeh',
      'RAW photo aesthetic, natural dynamic range, true-to-life color grading, professional studio daylight',
    ];

    const masterPrompt = [
      `[COMMERCIAL REALISM ENGINE — ${realismLevel.toUpperCase()}]`,
      subjectTokens.join(', '),
      realismTokens.join(', '),
      cameraTokens.join(', '),
    ].join('\n');

    // Negative prompt strictly avoiding AI artifacts (Spec 12)
    const negativePrompt = [
      'plastic skin, airbrushed skin, wax face, doll face, artificial symmetry, fake HDR, excessive sharpening',
      'impossible lighting, floating objects, AI glow, overdone bokeh, cartoon, 3D render, illustration, drawing',
      'extra fingers, deformed hands, fused fingers, missing limbs, mutated anatomy, bad proportions',
      'unnatural teeth, asymmetrical eyes, blurry, pixelated, jpeg artifacts, watermark, logo overlay',
    ].join(', ');

    return {
      masterPrompt,
      negativePrompt,
      technicalDirectives: [
        'Preserve character identity and physical descriptors',
        'Preserve authentic product packaging and colors',
        'Use native 30fps / 1080p target resolution',
      ],
      recommendedSeed: Math.floor(Math.random() * 1_000_000_000),
    };
  }
}
