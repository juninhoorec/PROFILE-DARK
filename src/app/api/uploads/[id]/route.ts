import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const mime:Record<string,string>={jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',pdf:'application/pdf'};
export async function GET(_request:Request,{params}:{params:{id:string}}){
  if(!/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|mov|webm|mp3|wav|m4a|pdf)$/.test(params.id))return NextResponse.json({error:'Arquivo inválido.'},{status:400});
  try{const bytes=await fs.readFile(path.join(process.cwd(),'data','uploads',params.id));const extension=params.id.split('.').pop()||'';return new NextResponse(bytes,{headers:{'Content-Type':mime[extension]||'application/octet-stream','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}});}catch{return NextResponse.json({error:'Arquivo não encontrado.'},{status:404});}
}

export async function DELETE(_request:Request,{params}:{params:{id:string}}){
  if(!/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|mov|webm|mp3|wav|m4a|pdf)$/.test(params.id))return NextResponse.json({error:'Arquivo inválido.'},{status:400});
  try{await fs.unlink(path.join(process.cwd(),'data','uploads',params.id));return NextResponse.json({deleted:true});}catch{return NextResponse.json({error:'Arquivo não encontrado.'},{status:404});}
}
