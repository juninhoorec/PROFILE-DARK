import fs from 'node:fs/promises';
import path from 'node:path';

type Fetcher=typeof fetch;
type Sleeper=(ms:number)=>Promise<void>;

const headers=(apiKey:string)=>({Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','X-Runway-Version':'2024-11-06'});

async function parseError(response:Response){
  const payload=await response.json().catch(()=>undefined) as {error?:string;message?:string}|undefined;
  return payload?.error||payload?.message||`Runway respondeu com HTTP ${response.status}.`;
}

async function runwayImageInput(value?:string){
  if(!value)return undefined;
  const local=value.match(/^\/api\/uploads\/([0-9a-f-]{36}\.(png|jpg|webp))$/i);
  if(!local)return value;
  const bytes=await fs.readFile(path.join(process.cwd(),'data','uploads',local[1]));
  const mime=local[2].toLowerCase()==='jpg'?'image/jpeg':`image/${local[2].toLowerCase()}`;
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

export async function generateRunwayVideo(params:{
  apiKey:string; prompt:string; imageUrl?:string; durationSeconds:number; aspectRatio?:string;
  model?:string; fetcher?:Fetcher; sleeper?:Sleeper; maxPolls?:number;
}){
  const fetcher=params.fetcher||fetch;
  const model=params.model||'gen4.5';
  const duration=params.durationSeconds<=5?5:10;
  const ratio=params.aspectRatio==='9:16'?'720:1280':params.aspectRatio==='1:1'?'960:960':'1280:720';
  const promptImage=await runwayImageInput(params.imageUrl);
  const create=await fetcher('https://api.dev.runwayml.com/v1/image_to_video',{
    method:'POST',headers:headers(params.apiKey),body:JSON.stringify({model,promptText:params.prompt.slice(0,1000),promptImage,duration,ratio}),
  });
  if(!create.ok)throw new Error(await parseError(create));
  const created=await create.json() as {id?:string};
  if(!created.id)throw new Error('A Runway não devolveu o identificador da tarefa.');
  const sleeper=params.sleeper||((ms)=>new Promise(resolve=>setTimeout(resolve,ms)));
  const maxPolls=params.maxPolls||60;
  for(let attempt=0;attempt<maxPolls;attempt+=1){
    if(attempt)await sleeper(5000);
    const response=await fetcher(`https://api.dev.runwayml.com/v1/tasks/${created.id}`,{headers:headers(params.apiKey)});
    if(!response.ok)throw new Error(await parseError(response));
    const task=await response.json() as {status?:string;output?:string[];failure?:string;failureCode?:string};
    if(task.status==='SUCCEEDED'){
      const videoUrl=task.output?.find(url=>/^https:\/\//i.test(url));
      if(!videoUrl)throw new Error('A tarefa terminou sem URL de vídeo.');
      return {videoUrl,taskId:created.id,model,actualDurationSeconds:duration};
    }
    if(['FAILED','CANCELED'].includes(task.status||''))throw new Error(task.failure||task.failureCode||`Tarefa Runway ${task.status}.`);
  }
  throw new Error('A geração continua em processamento na Runway. Consulte a tarefa novamente.');
}
