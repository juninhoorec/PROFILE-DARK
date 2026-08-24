import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';

export async function GET() {
  const concepts = db.getRadarConcepts();
  return NextResponse.json({ concepts });
}
