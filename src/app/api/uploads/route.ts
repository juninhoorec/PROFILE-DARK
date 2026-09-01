import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const allowed:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm','audio/mpeg':'mp3','audio/wav':'wav','audio/mp4':'m4a','application/pdf':'pdf'};
const uploadDir=path.join(process.cwd(),'data','uploads');
function detect(bytes:Uint8Array,name:string){
  const ascii=(start:number,length:number)=>Buffer.from(bytes.subarray(start,start+length)).toString('ascii');
  if(bytes[0]===0x89&&ascii(1,3)==='PNG')return 'image/png';
  if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
  if(ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP')return 'image/webp';
  if(ascii(0,4)==='%PDF')return 'application/pdf';
  if(ascii(0,4)==='RIFF'&&ascii(8,4)==='WAVE')return 'audio/wav';
  if(ascii(0,3)==='ID3'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0))return 'audio/mpeg';
  if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return 'video/webm';
  if(ascii(4,4)==='ftyp'){const ext=name.toLowerCase().split('.').pop();return ext==='mov'?'video/quicktime':ext==='m4a'?'audio/mp4':'video/mp4';}
  return undefined;
}

export async function POST(request:Request){
  try{
    const form=await request.formData();
    const file=form.get('file');
    if(!(file instanceof File))return NextResponse.json({error:'Selecione um arquivo.'},{status:400});
    if(file.size===0||file.size>50*1024*1024)return NextResponse.json({error:'O arquivo deve ter até 50 MB.'},{status:413});
    const bytes=new Uint8Array(await file.arrayBuffer());
    const detected=detect(bytes,file.name);
    if(!detected||!allowed[detected]||(file.type&&file.type!=='application/octet-stream'&&file.type!==detected))return NextResponse.json({error:'O conteúdo do arquivo não corresponde a um formato permitido.'},{status:415});
    await fs.mkdir(uploadDir,{recursive:true});
    const id=`${randomUUID()}.${allowed[detected]}`;
    await fs.writeFile(path.join(uploadDir,id),bytes,{flag:'wx'});
    return NextResponse.json({id,url:`/api/uploads/${id}`,name:file.name,type:detected,size:file.size},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível enviar o arquivo.'},{status:500});}
}
