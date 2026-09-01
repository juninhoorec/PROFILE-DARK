import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ROOT = path.resolve(process.cwd(), 'video e imagem do perfil');
const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/x-m4v',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const folder = url.searchParams.get('folder') || '';
  const relativeFile = url.searchParams.get('file') || '';
  const file = path.resolve(ROOT, folder, relativeFile);
  if (!folder || !relativeFile || (!file.startsWith(`${ROOT}${path.sep}`)) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
  }
  const body = fs.readFileSync(file);
  return new NextResponse(body, { headers: { 'Content-Type': CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600' } });
}
