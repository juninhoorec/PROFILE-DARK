import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { VoiceRouter } from '@/lib/ai/engine/voice/voice-router';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, customPhrase, voiceName } = body;

    const profile = profileId ? db.getProfileById(profileId) : undefined;
    const testProfile = profile || {
      id: 'temp_profile',
      name: 'Vó Zélia',
      avatarUrl: '',
      bio: '',
      niche: 'Casa & Família',
      personality: 'Acolhedora',
      toneOfVoice: 'Afetuosa',
      voiceName: voiceName || 'Microsoft Maria Desktop',
      realismScore: 95,
      language: 'pt-BR',
      characterLock: { face: true, age: true, hair: true, body: true, voice: true, personality: true },
      dna: {
        name: 'Vó Zélia',
        ageApparent: 68,
        nationality: 'Brasileira',
        niche: 'Casa',
        subNiche: 'Dicas',
        personality: 'Afetuosa',
        toneOfVoice: 'Próxima',
        speechPattern: 'Conversacional',
        visualAppearance: 'Senhora simpática de cabelos grisalhos',
        wardrobeStyle: 'Avental estampado',
        environmentPreference: 'Cozinha',
        voiceStyle: 'Quente',
        voiceLanguage: 'pt-BR',
        suggestedUsernames: ['@vozelia'],
        targetAudience: 'Famílias',
        buyerPersona: 'Donas de casa',
        primaryCommercialGoal: 'review' as const,
        mainCTA: 'Confira a dica',
        secondaryCTA: 'Compartilhe',
        salesStyle: 'Honesta',
        aggressivenessLevel: 'sutil' as const,
        editorialStrategy: 'Dicas reais',
        initialIdeas: [],
      },
      references: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await VoiceRouter.runVoiceTest(testProfile, customPhrase);

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      durationSeconds: result.durationSeconds,
      provider: result.provider,
      model: result.model,
      sampleRate: result.sampleRate,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
