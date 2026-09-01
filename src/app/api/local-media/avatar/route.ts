import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { db } from '@/lib/storage/db';
import { localUploadPath, newUploadPath } from '@/lib/local-media';
import { createTalkingAvatar } from '@/lib/talking-avatar';

export const runtime = 'nodejs';
export const maxDuration = 300;
const schema = z.object({ imageUrl: z.string(), audioUrl: z.string(), profileId: z.string(), title: z.string().trim().min(2).max(120).default('Avatar falante local'), durationSeconds: z.number().min(1).max(20).default(20), mouthX: z.number().min(0.2).max(0.8).default(0.5), mouthY: z.number().min(0.15).max(0.65).default(0.25) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const profile = db.getProfileById(input.profileId);
    if (!profile) throw new Error('Profile não encontrado.');
    const image = await localUploadPath(input.imageUrl, ['png', 'jpg', 'jpeg', 'webp']);
    const audio = await localUploadPath(input.audioUrl, ['wav', 'mp3', 'm4a']);
    const output = await newUploadPath('mp4');
    const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
    await fs.access(ffmpeg);
    const metrics = await createTalkingAvatar({ image, audio, output: output.file, ffmpeg, durationSeconds: input.durationSeconds, mouthXRatio: input.mouthX, mouthYRatio: input.mouthY });
    const stats = await fs.stat(output.file);
    db.saveLibraryItem({ id: `lib_avatar_${output.id}`, title: input.title, profileName: profile.name, profileAvatarUrl: input.imageUrl, thumbnailUrl: input.imageUrl, videoUrl: output.url, audioUrl: input.audioUrl, duration: `00:${String(Math.round(metrics.durationSeconds)).padStart(2, '0')}`, resolution: '720x1280', status: 'concluido', createdAt: new Date().toISOString(), tags: [profile.name, 'avatar falante', 'local grátis', 'lip sync'], fileSizeMb: Math.round(stats.size / 104857.6) / 10 });
    return NextResponse.json({ url: output.url, provider: 'Avatar Falante Local', free: true, fileSizeMb: Math.round(stats.size / 104857.6) / 10, metrics });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível gerar o avatar falante.' }, { status: 400 });
  }
}
