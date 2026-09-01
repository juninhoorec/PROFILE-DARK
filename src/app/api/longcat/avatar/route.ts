import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { db } from '@/lib/storage/db';
import { localUploadPath, newUploadPath } from '@/lib/local-media';
import { generateLongCatAvatar } from '@/lib/ai/providers/longcat-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const schema = z.object({
  imageUrl: z.string(),
  audioUrl: z.string(),
  profileId: z.string(),
  prompt: z.string().trim().min(10).max(1200),
  resolution: z.enum(['480p', '720p']).default('480p'),
  seed: z.number().int().min(0).max(2_147_483_647).default(42),
  title: z.string().trim().min(2).max(120).default('Avatar IA — LongCat'),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const input = schema.parse(await request.json());
    const profile = db.getProfileById(input.profileId);
    if (!profile) throw new Error('Profile não encontrado.');
    const imagePath = await localUploadPath(input.imageUrl, ['png', 'jpg', 'jpeg', 'webp']);
    const audioPath = await localUploadPath(input.audioUrl, ['wav', 'mp3', 'm4a']);
    const output = await newUploadPath('mp4');
    const generated = await generateLongCatAvatar({ imagePath, audioPath, prompt: input.prompt, resolution: input.resolution, seed: input.seed, outputPath: output.file });
    const stats = await fs.stat(output.file);
    db.saveLibraryItem({
      id: `lib_longcat_${output.id}`,
      title: input.title,
      profileName: profile.name,
      profileAvatarUrl: input.imageUrl,
      thumbnailUrl: input.imageUrl,
      videoUrl: output.url,
      audioUrl: input.audioUrl,
      duration: '00:05',
      resolution: input.resolution,
      status: 'concluido',
      createdAt: new Date().toISOString(),
      tags: [profile.name, 'LongCat Avatar 1.5', 'IA', 'lip sync', 'Hugging Face ZeroGPU'],
      fileSizeMb: Math.round(stats.size / 104857.6) / 10,
    });
    return NextResponse.json({ url: output.url, provider: 'LongCat-Video-Avatar 1.5', free: true, durationSeconds: 5, resolution: input.resolution, renderTimeMs: Date.now() - startedAt, bytes: generated.bytes });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : 'Não foi possível gerar o avatar com LongCat.';
    return NextResponse.json({ error: message }, { status: /cota|ocupada|autenticação|demorou/i.test(message) ? 503 : 400 });
  }
}

