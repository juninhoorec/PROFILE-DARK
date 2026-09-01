import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { Profile } from '@/lib/types';
import { dnaFromArchetype, rankArchetypes } from '@/lib/profile-archetypes';

export async function GET() {
  const legacyDemoIds=new Set(['prof_luna_star','prof_orion_tech','prof_review_pro','prof_bela_skin']);
  const profiles = db.getProfiles().filter(profile=>!legacyDemoIds.has(profile.id)).map(profile=>profile.voiceSampleUrl?.startsWith('/assets/audio/')?{...profile,voiceSampleUrl:undefined}:profile);
  return NextResponse.json({ profiles });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      bio,
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
    const existing=db.getProfiles().find(profile=>profile.name.trim().toLowerCase()===String(name).trim().toLowerCase()&&profile.niche===niche&&profile.bio===bio);
    if(existing)return NextResponse.json({profile:existing,reused:true},{status:200});
    const fallbackArchetype=rankArchetypes(`${name} ${niche||''} ${personality||''}`,1)[0];
    const resolvedDna=dna||dnaFromArchetype(fallbackArchetype,niche||name);

    const newProfile: Profile = {
      id: `prof_${crypto.randomUUID()}`,
      name,
      avatarUrl: avatarUrl || fallbackArchetype.avatarUrl,
      bio: bio || `${fallbackArchetype.role} — ${fallbackArchetype.expertise}.`,
      niche: niche || fallbackArchetype.niche,
      personality: personality || fallbackArchetype.personality,
      toneOfVoice: toneOfVoice || fallbackArchetype.tone,
      voiceName: voiceName || `${fallbackArchetype.name.split(' ')[0]} (Natural)`,
      realismScore: realismScore ?? 0,
      language: language || 'Português (BR)',
      characterLock: characterLock || {
        face: false,
        age: false,
        hair: false,
        body: false,
        voice: false,
        personality: false,
      },
      dna: {...resolvedDna,name},
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
