import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const job = db.getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: 'Job não encontrado.' }, { status: 404 });
    }

    if (job.status === 'concluido') {
      return NextResponse.json({ error: 'Não é possível cancelar um job já concluído.' }, { status: 400 });
    }

    if (job.status === 'cancelado') {
      return NextResponse.json({ job, message: 'Job já estava cancelado; nenhum novo estorno foi realizado.' });
    }

    job.status = 'cancelado';
    db.saveJob(job);
    db.refundCredits(job.costCredits, `Reembolso por cancelamento do job ${job.id}`, job.id);

    return NextResponse.json({ job, message: 'Trabalho cancelado sem qualquer cobrança.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
