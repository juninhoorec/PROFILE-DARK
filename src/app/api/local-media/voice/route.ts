import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { newUploadPath, runProcess } from '@/lib/local-media';
import { db } from '@/lib/storage/db';

export const runtime = 'nodejs';
const schema = z.object({ text: z.string().trim().min(2).max(3000), voice: z.string().min(2).max(100), rate: z.number().int().min(-5).max(5).default(0), profileId: z.string().optional() });

export async function POST(request: Request) {
  let textFile = '';
  try {
    const input = schema.parse(await request.json());
    const output = await newUploadPath('wav');
    textFile = path.join(process.cwd(), 'data', `speech-${process.pid}-${Date.now()}.txt`);
    await fs.writeFile(textFile, input.text, 'utf8');
    const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    await runProcess(powershell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(process.cwd(), 'scripts', 'synthesize-windows-voice.ps1'), '-TextFile', textFile, '-OutputFile', output.file, '-Voice', input.voice, '-Rate', String(input.rate)]);
    const profile = input.profileId ? db.getProfileById(input.profileId) : undefined;
    db.saveLibraryItem({ id: `lib_voice_${output.id}`, title: `Narração — ${profile?.name || 'Estúdio local'}`, profileName: profile?.name || 'Estúdio local', profileAvatarUrl: profile?.avatarUrl || '', thumbnailUrl: profile?.avatarUrl || '', audioUrl: output.url, duration: 'Áudio', resolution: 'WAV', status: 'concluido', createdAt: new Date().toISOString(), tags: ['voz', 'local', input.voice], fileSizeMb: 0 });
    return NextResponse.json({ url: output.url, voice: input.voice, provider: 'Windows TTS local', free: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível gerar a voz.' }, { status: 400 });
  } finally { if (textFile) await fs.unlink(textFile).catch(() => undefined); }
}
