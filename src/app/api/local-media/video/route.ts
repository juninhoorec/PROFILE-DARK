import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { db } from '@/lib/storage/db';
import { localUploadPath, newUploadPath, runProcess } from '@/lib/local-media';

export const runtime = 'nodejs';
export const maxDuration = 300;
const schema = z.object({ imageUrl: z.string(), audioUrl: z.string(), profileId: z.string(), title: z.string().trim().min(2).max(120).default('Vídeo do Estúdio Local') });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const profile = db.getProfileById(input.profileId);
    if (!profile) throw new Error('Profile não encontrado.');
    const image = await localUploadPath(input.imageUrl, ['png', 'jpg', 'jpeg', 'webp']);
    const audio = await localUploadPath(input.audioUrl, ['wav', 'mp3', 'm4a']);
    const output = await newUploadPath('mp4');
    const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
    await fs.access(ffmpeg).catch(() => { throw new Error('Renderizador local não encontrado.'); });
    const filter = "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.00035,1.08)':d=1:s=720x1280:fps=30,format=yuv420p";
    await runProcess(ffmpeg, ['-y', '-loop', '1', '-i', image, '-i', audio, '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', output.file], 300_000);
    const stats = await fs.stat(output.file);
    const now = new Date().toISOString();
    db.saveLibraryItem({ id: `lib_local_${output.id}`, title: input.title, profileName: profile.name, profileAvatarUrl: input.imageUrl, thumbnailUrl: input.imageUrl, videoUrl: output.url, audioUrl: input.audioUrl, duration: 'Auto', resolution: '720x1280', status: 'concluido', createdAt: now, tags: [profile.name, 'vídeo vertical', 'local grátis'], fileSizeMb: Math.round(stats.size / 104857.6) / 10 });
    return NextResponse.json({ url: output.url, thumbnailUrl: input.imageUrl, provider: 'FFmpeg local', free: true, fileSizeMb: Math.round(stats.size / 104857.6) / 10 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível renderizar o vídeo.' }, { status: 400 });
  }
}
