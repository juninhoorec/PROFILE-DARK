import { ProfileDNA } from '../types';

export class RealismEngine {
  static buildMasterImagePrompt(dna: Partial<ProfileDNA>): {
    prompt: string;
    negativePrompt: string;
    targetEngines: string[];
  } {
    const name = dna.name || 'Personagem Virtual';
    const age = dna.ageApparent || 28;
    const nationality = dna.nationality || 'Brasileira';
    const appearance = dna.visualAppearance || 'traços marcantes, pele natural com viço autêntico e olhos expressivos';
    const wardrobe = dna.wardrobeStyle || 'alfaiataria moderna e minimalista em tons neutros';
    const env = dna.environmentPreference || 'apartamento contemporâneo iluminado com luz natural de fim de tarde';
    const niche = dna.niche || 'Lifestyle e Beleza';

    const prompt = `[HYPER-REALISTIC MASTER CHARACTER PORTRAIT FOR CONSISTENCY]
Subject: Cinematic 8K commercial photo of ${name}, a ${age}-year-old ${nationality} ${niche} creator.
Facial Features: ${appearance}, natural skin micro-texture, visible fine pores, authentic subsurface scattering, zero artificial smoothing or plastic look.
Eyes: Sharp, captivating natural gaze looking directly into the camera lens with soft catchlights.
Hair & Styling: Impeccably styled natural hair with realistic individual strand definition.
Wardrobe: Wearing ${wardrobe}.
Setting & Ambience: Soft background of ${env}, elegant atmospheric depth of field with creamy bokeh.
Optics & Lighting: 85mm portrait lens, f/1.8 aperture, Hasselblad color calibration, 3-point soft studio lighting with gentle golden rim light on shoulders.
Style: Hyper-realistic RAW photograph, master commercial aesthetic, authentic human realism.`;

    const negativePrompt = `plastic skin, airbrushed, doll face, 3D render, cartoon, illustration, oversaturated, deformed fingers, extra limbs, asymmetrical eyes, weird teeth, watermark, text, low resolution, blurry, uncanny valley.`;

    return {
      prompt,
      negativePrompt,
      targetEngines: ['Google Gemini (Imagen 3)', 'ChatGPT / DALL-E 3', 'FLUX.1 Pro', 'Midjourney v6'],
    };
  }
}
