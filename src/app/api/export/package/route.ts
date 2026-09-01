import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import JSZip from 'jszip';
import { assertSafeUrl } from '@/lib/affiliate/resolver';

async function addRemote(folder:JSZip,url:string,name:string){
  const parsed=new URL(url); await assertSafeUrl(parsed);
  const response=await fetch(parsed,{redirect:'follow',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Não foi possível baixar ${name} (${response.status}).`);
  await assertSafeUrl(new URL(response.url));
  const declared=Number(response.headers.get('content-length')||0);
  if(declared>100*1024*1024)throw new Error(`${name} excede o limite de 100 MB.`);
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>100*1024*1024)throw new Error(`${name} excede o limite de 100 MB.`);
  folder.file(name,bytes);
}
const clock=(seconds:number)=>{const ms=Math.round(seconds*1000);const h=Math.floor(ms/3600000);const m=Math.floor(ms%3600000/60000);const s=Math.floor(ms%60000/1000);const rest=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(rest).padStart(3,'0')}`;};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, includeVideo = true, includeThumbnail = true, includeSrt = true, includeScript = true, includeAudio = true, includeMetadata = true } = body;

    const job = db.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job não encontrado.' }, { status: 404 });
    }
    if(job.isDemo||job.videoUrl?.includes('commondatastorage.googleapis.com'))return NextResponse.json({error:'Itens demonstrativos não podem ser exportados.'},{status:400});
    if(job.status!=='concluido'||!job.videoUrl)return NextResponse.json({error:'O job ainda não possui um vídeo real concluído.'},{status:409});

    const zip = new JSZip();
    const folderName = `ProfileDark_${job.profileName.replace(/\s+/g, '_')}_${job.id}`;
    const folder = zip.folder(folderName) || zip;

    if (includeScript && job.creativePlan) {
      folder.file('roteiro_completo.txt', job.creativePlan.fullScript);
      folder.file('legenda_e_copy.txt', job.creativePlan.captionText);
    }

    if (includeSrt && job.creativePlan) {
      let elapsed=0;
      const srt=job.creativePlan.scenes.map((scene,index)=>{const start=elapsed;elapsed+=scene.durationSeconds;return `${index+1}\n${clock(start)} --> ${clock(elapsed)}\n${scene.narrationScript}`;}).join('\n\n');
      folder.file('legendas.srt', `${srt}\n`);
    }

    if (includeMetadata) {
      const metadata = {
        title: job.title,
        profile: job.profileName,
        product: job.productName || 'N/A',
        resolution: job.resolution,
        durationSeconds: job.durationSeconds,
        qualityScore: job.qualityScore ?? null,
        provider: job.providerUsed || 'Não informado',
        exportedAt: new Date().toISOString(),
      };
      folder.file('metadata.json', JSON.stringify(metadata, null, 2));
    }

    if(includeVideo)await addRemote(folder,job.videoUrl,`video.${job.videoUrl.split('?')[0].split('.').pop()||'mp4'}`);
    if(includeThumbnail&&job.thumbnailUrl)await addRemote(folder,job.thumbnailUrl,`thumbnail.${job.thumbnailUrl.split('?')[0].split('.').pop()||'jpg'}`);
    if(includeAudio&&job.audioUrl)await addRemote(folder,job.audioUrl,`audio.${job.audioUrl.split('?')[0].split('.').pop()||'mp3'}`);

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
