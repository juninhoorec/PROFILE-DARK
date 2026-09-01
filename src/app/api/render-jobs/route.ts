import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { INITIAL_RENDER_JOBS } from '@/lib/constants';

export async function GET() {
  const demoIds=new Set(INITIAL_RENDER_JOBS.map(job=>job.id));
  const jobs = db.getJobs().map(job=>({...job,isDemo:job.isDemo||demoIds.has(job.id)||Boolean(job.videoUrl?.includes('commondatastorage.googleapis.com'))}));
  return NextResponse.json({ jobs });
}
