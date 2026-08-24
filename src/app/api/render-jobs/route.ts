import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';

export async function GET() {
  const jobs = db.getJobs();
  return NextResponse.json({ jobs });
}
