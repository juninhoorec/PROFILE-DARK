import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = db.getLibraryItems().map((item) => /^lib_[1-5]$/.test(item.id) || item.videoUrl?.includes('commondatastorage.googleapis.com/gtv-videos-bucket/sample/') ? { ...item, isDemo: true } : item);
  return NextResponse.json({ items });
}
