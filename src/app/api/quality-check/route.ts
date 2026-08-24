import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { VisualInspector } from '@/lib/ai/visual-inspector';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (jobId) {
    let qc = db.getQualityCheckByJobId(jobId);
    if (!qc) {
      const job = db.getJobById(jobId);
      if (job) {
        qc = VisualInspector.inspect(job);
        db.saveQualityCheck(qc);
      }
    }
    return NextResponse.json({ qualityCheck: qc });
  }

  return NextResponse.json({ qualityChecks: db.getQualityChecks() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId } = body;
    const job = db.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job não encontrado.' }, { status: 404 });
    }

    const qc = VisualInspector.inspect(job);
    db.saveQualityCheck(qc);

    return NextResponse.json({ qualityCheck: qc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
