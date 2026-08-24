import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import JSZip from 'jszip';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, includeVideo = true, includeThumbnail = true, includeSrt = true, includeScript = true, includeAudio = true, includeMetadata = true } = body;

    const job = db.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job não encontrado.' }, { status: 404 });
    }

    const zip = new JSZip();
    const folderName = `ProfileDark_${job.profileName.replace(/\s+/g, '_')}_${job.id}`;
    const folder = zip.folder(folderName) || zip;

    if (includeScript && job.creativePlan) {
      folder.file('roteiro_completo.txt', job.creativePlan.fullScript);
      folder.file('legenda_e_copy.txt', job.creativePlan.captionText);
    }

    if (includeSrt && job.creativePlan) {
      const sampleSrt = `1\n00:00:00,000 --> 00:00:03,500\n${job.creativePlan.hook}\n\n2\n00:00:03,500 --> 00:00:18,000\n${job.creativePlan.scenes[1]?.narrationScript || 'Demonstração de produto.'}\n\n3\n00:00:18,000 --> 00:00:24,000\n${job.creativePlan.ctaText}\n`;
      folder.file('legendas.srt', sampleSrt);
    }

    if (includeMetadata) {
      const metadata = {
        title: job.title,
        profile: job.profileName,
        product: job.productName || 'N/A',
        resolution: job.resolution,
        durationSeconds: job.durationSeconds,
        qualityScore: job.qualityScore || 97,
        provider: job.providerUsed || 'Runway Gen-3 Alpha',
        exportedAt: new Date().toISOString(),
      };
      folder.file('metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Generate zip base64
    const content = await zip.generateAsync({ type: 'base64' });

    return NextResponse.json({
      filename: `${folderName}.zip`,
      base64: content,
      mimeType: 'application/zip',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
