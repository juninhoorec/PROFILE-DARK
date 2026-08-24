import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { Profile } from '@/lib/types';

export async function GET() {
  const profiles = db.getProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      avatarUrl,
      niche,
      personality,
      toneOfVoice,
      voiceName,
      language,
      realismScore,
      dna,
      references,
      characterLock,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do profile é obrigatório.' }, { status: 400 });
    }

    const newProfile: Profile = {
      id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: dna?.personality || 'Perfil virtual de alta fidelidade.',
      niche: niche || 'Geral',
      personality: personality || 'Carismática',
      toneOfVoice: toneOfVoice || 'Acolhedor',
      voiceName: voiceName || 'Luna (Natural)',
      realismScore: realismScore || 90,
      language: language || 'Português (BR)',
      characterLock: characterLock || {
        face: true,
        age: true,
        hair: true,
        body: true,
        voice: true,
        personality: true,
      },
      dna: dna || {
        name,
        ageApparent: 28,
        nationality: 'Brasileira',
        niche: niche || 'Lifestyle',
        subNiche: 'Geral',
        personality: personality || 'Carismática',
        toneOfVoice: toneOfVoice || 'Acolhedor',
        speechPattern: 'Fluido e natural',
        visualAppearance: 'Traços autênticos e expressivos',
        wardrobeStyle: 'Elegante contemporâneo',
        environmentPreference: 'Estúdio moderno iluminado',
        voiceStyle: 'Natural pt-BR',
        voiceLanguage: 'pt-BR',
        suggestedUsernames: [`@${name.toLowerCase().replace(/\s+/g, '')}`],
        targetAudience: 'Público amplo',
        buyerPersona: 'Consumidor consciente',
        primaryCommercialGoal: 'conversao',
        mainCTA: 'Confira no link da bio!',
        secondaryCTA: 'Comente para saber mais.',
        salesStyle: 'Recomendação consultiva',
        aggressivenessLevel: 'moderado',
        editorialStrategy: 'Conteúdo de valor + Inserção comercial',
        initialIdeas: ['Apresentação de rotina', 'Dica de ouro do dia'],
      },
      references: references || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveProfile(newProfile);
    return NextResponse.json({ profile: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
