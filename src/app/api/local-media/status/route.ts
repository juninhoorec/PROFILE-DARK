import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { runProcess } from '@/lib/local-media';

export const runtime = 'nodejs';

export async function GET() {
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  const voices: string[] = [];
  const output = path.join(process.cwd(), 'data', `voices-${process.pid}.txt`);
  try {
    const command = `Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name } | Set-Content -LiteralPath '${output.replace(/'/g, "''")}' -Encoding UTF8; $s.Dispose()`;
    await runProcess(powershell, ['-NoProfile', '-NonInteractive', '-Command', command], 20_000);
    voices.push(...fs.readFileSync(output, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean));
  } catch { /* status is returned below */ }
  finally { try { fs.unlinkSync(output); } catch { /* best effort */ } }
  return NextResponse.json({ ready: voices.length > 0 && fs.existsSync(ffmpeg), voices, ffmpeg: fs.existsSync(ffmpeg) });
}
