import { NextResponse } from 'next/server';
import { z } from 'zod';
import { persistGeneratedAsset } from '@/lib/storage/generated-assets';
import { db } from '@/lib/storage/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  prompt: z.string().trim().min(10).max(2048),
  profileId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { prompt, profileId } = schema.parse(await request.json());
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) {
      return NextResponse.json({ error: 'Configure CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN no .env.local.' }, { status: 503 });
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps: 4 }),
      signal: AbortSignal.timeout(55_000),
    });
    const payload = await response.json() as { success?: boolean; result?: { image?: string }; errors?: Array<{ message?: string }> };
    if (!response.ok || !payload.success || !payload.result?.image) {
      const providerMessage = payload.errors?.map((item) => item.message).filter(Boolean).join(' ') || 'A Cloudflare não devolveu uma imagem.';
      const friendly = /NSFW/i.test(providerMessage)
        ? 'O filtro da Cloudflare bloqueou este prompt. Reescreva-o com linguagem neutra e tente novamente.'
        : providerMessage;
      return NextResponse.json({ error: friendly }, { status: response.status || 502 });
    }

    const bytes = Uint8Array.from(Buffer.from(payload.result.image, 'base64'));
    const asset = await persistGeneratedAsset(bytes, 'jpg');
    const profile = profileId ? db.getProfileById(profileId) : undefined;
    db.saveLibraryItem({
      id: `lib_cf_${asset.id}`,
      title: `Imagem FLUX — ${profile?.name || 'Estúdio'}`,
      profileName: profile?.name || 'Estúdio',
      profileAvatarUrl: profile?.avatarUrl || asset.url,
      thumbnailUrl: asset.url,
      duration: 'Imagem',
      resolution: 'FLUX',
      status: 'concluido',
      createdAt: new Date().toISOString(),
      tags: ['imagem', 'Cloudflare', 'FLUX.1 Schnell'],
      fileSizeMb: Math.round(bytes.byteLength / 104857.6) / 10,
    });
    return NextResponse.json({ url: asset.url, provider: 'Cloudflare Workers AI', model: 'FLUX.1 Schnell', freeTier: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : 'Não foi possível gerar a imagem.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
