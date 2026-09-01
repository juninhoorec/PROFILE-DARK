import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const uploadsDirectory = path.join(process.cwd(), 'data', 'uploads');

export function runProcess(executable: string, args: string[], timeoutMs = 180_000) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false });
    let errorOutput = '';
    child.stderr.on('data', (chunk) => { errorOutput += String(chunk).slice(-6000); });
    const timer = setTimeout(() => { child.kill(); reject(new Error('A geração excedeu o tempo limite.')); }, timeoutMs);
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(errorOutput.trim() || `Processo encerrado com código ${code}.`));
    });
  });
}

export async function localUploadPath(url: string, allowedExtensions: string[]) {
  const match = /^\/api\/uploads\/([0-9a-f-]+\.([a-z0-9]+))$/i.exec(url);
  if (!match || !allowedExtensions.includes(match[2].toLowerCase())) throw new Error('Use um arquivo enviado ao próprio PD.');
  const file = path.join(uploadsDirectory, match[1]);
  await fs.access(file);
  return file;
}

export async function newUploadPath(extension: string) {
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const id = `${randomUUID()}.${extension}`;
  return { id, file: path.join(uploadsDirectory, id), url: `/api/uploads/${id}` };
}

export async function resolveMediaToFile(urlOrPath: string, fallbackExtension = 'jpg'): Promise<string> {
  await fs.mkdir(uploadsDirectory, { recursive: true });

  // 1. If it's already an existing local file
  if (path.isAbsolute(urlOrPath)) {
    try {
      await fs.access(urlOrPath);
      return urlOrPath;
    } catch { /* proceed */ }
  }

  // 2. If it's an internal upload URL
  const uploadMatch = /^\/api\/uploads\/([0-9a-f-]+\.[a-z0-9]+)$/i.exec(urlOrPath);
  if (uploadMatch) {
    const local = path.join(uploadsDirectory, uploadMatch[1]);
    try {
      await fs.access(local);
      return local;
    } catch { /* proceed */ }
  }

  // 3. If it's a web URL, download and cache
  if (/^https?:\/\//i.test(urlOrPath)) {
    try {
      const res = await fetch(urlOrPath, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const asset = await newUploadPath(fallbackExtension);
        await fs.writeFile(asset.file, buf);
        return asset.file;
      }
    } catch { /* fallback */ }
  }

  // 4. Generate a clean fallback image buffer if image
  const asset = await newUploadPath(fallbackExtension);
  if (fallbackExtension === 'jpg' || fallbackExtension === 'png') {
    const svg = Buffer.from(`
      <svg width="720" height="1280" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#181424"/>
        <circle cx="360" cy="480" r="180" fill="#2d2248"/>
        <circle cx="360" cy="440" r="120" fill="#eed9c4"/>
        <text x="360" y="780" font-family="Arial" font-size="36" fill="#ffffff" text-anchor="middle">Profile Dark Master</text>
      </svg>
    `);
    await sharp(svg).jpeg({ quality: 92 }).toFile(asset.file);
    return asset.file;
  }

  return asset.file;
}
