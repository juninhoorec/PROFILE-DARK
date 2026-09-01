import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getMediaFile } from '@/lib/social/social-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export async function GET(request: Request, { params }: { params: { folder: string; file: string } }) {
  const file = getMediaFile(decodeURIComponent(params.folder), decodeURIComponent(params.file));
  if (!file) return NextResponse.json({ error: 'Mídia não encontrada.' }, { status: 404 });
  const stat = fs.statSync(file);
  const range = request.headers.get('range');
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return new NextResponse(null, { status: 416 });
    const start = Number(match[1]);
    const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    const stream = fs.createReadStream(file, { start, end });
    return new NextResponse(stream as unknown as BodyInit, { status: 206, headers: { 'Content-Type': type, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' } });
  }
  const stream = fs.createReadStream(file);
  return new NextResponse(stream as unknown as BodyInit, { headers: { 'Content-Type': type, 'Content-Length': String(stat.size), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' } });
}
