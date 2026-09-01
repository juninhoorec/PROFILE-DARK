import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { runProcess } from './local-media';

const WIDTH = 512;
const HEIGHT = 896;
const FPS = 18;
const SAMPLE_RATE = 16_000;

function audioEnvelope(pcm: Buffer, frameCount: number) {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
  const values: number[] = [];
  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = Math.floor(frame * SAMPLE_RATE / FPS);
    const end = Math.min(samples.length, Math.floor((frame + 1) * SAMPLE_RATE / FPS));
    let energy = 0;
    for (let index = start; index < end; index += 2) energy += Math.abs(samples[index]);
    values.push(energy / Math.max(1, Math.ceil((end - start) / 2)));
  }
  const sorted = [...values].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.18)] || 0;
  const ceiling = sorted[Math.floor(sorted.length * 0.92)] || 1;
  const normalized = values.map((value) => Math.max(0, Math.min(1, (value - floor) / Math.max(1, ceiling - floor))));
  for (let index = 1; index < normalized.length; index += 1) normalized[index] = normalized[index - 1] * 0.42 + normalized[index] * 0.58;
  return normalized;
}

async function renderFrame(base: Buffer, destination: string, frame: number, openness: number, mouthXRatio: number, mouthYRatio: number) {
  const swayX = Math.round(Math.sin(frame / 15) * 4 + Math.sin(frame / 43) * 2);
  const swayY = Math.round(Math.sin(frame / 21) * 3);
  const canvas = await sharp(base).extract({ left: 12 + swayX, top: 16 + swayY, width: WIDTH, height: HEIGHT }).toBuffer();
  const mouthWidth = 104;
  const mouthHeight = 34;
  const mouthX = Math.max(0, Math.min(WIDTH - mouthWidth, Math.round(WIDTH * mouthXRatio - mouthWidth / 2)));
  const mouthY = Math.max(0, Math.min(HEIGHT - mouthHeight - 10, Math.round(HEIGHT * mouthYRatio - mouthHeight / 2)));
  const jawShift = Math.round(openness * 3);
  const stretchedHeight = mouthHeight + Math.round(openness * 15);
  const mouth = await sharp(canvas).extract({ left: mouthX, top: mouthY, width: mouthWidth, height: mouthHeight }).resize(mouthWidth, stretchedHeight, { fit: 'fill' }).blur(openness > 0.65 ? 0.35 : 0.3).toBuffer();
  const shadowOpacity = Math.round(28 + openness * 38);
  const shadow = Buffer.from(`<svg width="${mouthWidth}" height="${stretchedHeight}"><ellipse cx="${mouthWidth / 2}" cy="${stretchedHeight * 0.58}" rx="${mouthWidth * 0.21}" ry="${2 + openness * 5}" fill="rgba(35,10,15,${shadowOpacity / 255})"/></svg>`);
  await sharp(canvas)
    .composite([
      { input: mouth, left: mouthX, top: mouthY + jawShift },
      { input: shadow, left: mouthX, top: mouthY + jawShift },
    ])
    .jpeg({ quality: 88, chromaSubsampling: '4:2:0' })
    .toFile(destination);
}

export async function createTalkingAvatar(params: { image: string; audio: string; output: string; ffmpeg: string; durationSeconds: number; mouthXRatio?: number; mouthYRatio?: number }) {
  const duration = Math.max(1, Math.min(20, params.durationSeconds));
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'profile-dark-avatar-'));
  const pcmFile = path.join(tempRoot, 'audio.pcm');
  const startedAt = Date.now();
  try {
    await runProcess(params.ffmpeg, ['-y', '-i', params.audio, '-t', String(duration), '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 's16le', pcmFile], 60_000);
    const pcm = await fs.readFile(pcmFile);
    const availableDuration = pcm.byteLength / 2 / SAMPLE_RATE;
    const actualDuration = Math.max(1, Math.min(duration, availableDuration));
    const frameCount = Math.max(1, Math.ceil(actualDuration * FPS));
    const envelope = audioEnvelope(pcm, frameCount);
    const base = await sharp(params.image).resize(WIDTH + 24, HEIGHT + 32, { fit: 'cover', position: 'centre' }).modulate({ brightness: 1.015, saturation: 1.025 }).toBuffer();
    const concurrency = 3;
    for (let start = 0; start < frameCount; start += concurrency) {
      await Promise.all(Array.from({ length: Math.min(concurrency, frameCount - start) }, (_, offset) => {
        const frame = start + offset;
        const syllable = 0.82 + Math.sin(frame * 1.7) * 0.18;
        const openness = Math.max(0, envelope[frame] * syllable);
        return renderFrame(base, path.join(tempRoot, `frame-${String(frame + 1).padStart(4, '0')}.jpg`), frame, openness, params.mouthXRatio ?? 0.5, params.mouthYRatio ?? 0.3);
      }));
    }
    await runProcess(params.ffmpeg, ['-y', '-framerate', String(FPS), '-i', path.join(tempRoot, 'frame-%04d.jpg'), '-i', params.audio, '-t', actualDuration.toFixed(3), '-vf', 'scale=720:1280:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', params.output], 300_000);
    return { durationSeconds: actualDuration, frameCount, fps: FPS, renderTimeMs: Date.now() - startedAt, peakMouthOpenness: Math.max(...envelope) };
  } finally {
    const resolved = path.resolve(tempRoot);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('profile-dark-avatar-')) await fs.rm(resolved, { recursive: true, force: true });
  }
}
