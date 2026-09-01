import { NextResponse } from 'next/server';
import { z } from 'zod';
import { persistGeneratedAsset } from '@/lib/storage/generated-assets';
import { db } from '@/lib/storage/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  text: z.string().trim().min(2).max(2500),
  profileId: z.string().optional(),
  voiceId: z.string().default('21m00Tcm4TlvDq8ikWAM'),
});

export async function POST(request: Request) {
  if (process.env.FREE_ONLY_MODE !== 'false') {
    return NextResponse.json({ error: 'ElevenLabs está desativada. O PD está protegido no modo 100% gratuito.' }, { status: 403 });
  }
  try {
    const input = schema.parse(await request.json());
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Configure ELEVENLABS_API_KEY no .env.local.' }, { status: 503 });
    const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID || input.voiceId;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(configuredVoiceId)}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, Accept: 'audio/mpeg', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.48, similarity_boost: 0.78, style: 0.3, use_speaker_boost: true },
      }),
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { detail?: { message?: string } | string };
      const providerMessage = typeof payload.detail === 'string' ? payload.detail : payload.detail?.message;
      return NextResponse.json({ error: providerMessage || 'A ElevenLabs recusou a geração.' }, { status: response.status });
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const asset = await persistGeneratedAsset(bytes, 'mp3');
    const profile = input.profileId ? db.getProfileById(input.profileId) : undefined;
    db.saveLibraryItem({ id: `lib_eleven_${asset.id}`, title: `Voz neural — ${profile?.name || 'Estúdio'}`, profileName: profile?.name || 'Estúdio', profileAvatarUrl: profile?.avatarUrl || '', thumbnailUrl: profile?.avatarUrl || '', audioUrl: asset.url, duration: 'Áudio', resolution: 'MP3', status: 'concluido', createdAt: new Date().toISOString(), tags: ['voz neural', 'ElevenLabs', 'português'], fileSizeMb: Math.round(bytes.byteLength / 104857.6) / 10 });
    return NextResponse.json({ url: asset.url, provider: 'ElevenLabs', model: 'eleven_multilingual_v2' });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : 'Não foi possível gerar a voz neural.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
