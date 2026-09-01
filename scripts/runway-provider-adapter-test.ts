import {strict as assert} from 'node:assert';
import {generateRunwayVideo} from '../src/lib/ai/providers/runway-provider';

async function run(){
  const requests:Array<{url:string;init?:RequestInit}>=[];
  const fetcher=(async(input:string|URL|Request,init?:RequestInit)=>{
    const url=String(input);requests.push({url,init});
    if(url.endsWith('/image_to_video'))return new Response(JSON.stringify({id:'task_real_123'}),{status:200,headers:{'Content-Type':'application/json'}});
    if(url.endsWith('/tasks/task_real_123'))return new Response(JSON.stringify({status:'SUCCEEDED',output:['https://cdn.runway.test/video.mp4']}),{status:200,headers:{'Content-Type':'application/json'}});
    return new Response(JSON.stringify({error:'inesperado'}),{status:404});
  }) as typeof fetch;
  const result=await generateRunwayVideo({apiKey:'segredo',prompt:'Produto em movimento',durationSeconds:3,aspectRatio:'9:16',fetcher,sleeper:async()=>{},maxPolls:2});
  assert.equal(result.videoUrl,'https://cdn.runway.test/video.mp4');
  assert.equal(result.actualDurationSeconds,5,'O teste curto deve respeitar o mínimo real de 5 segundos do provider.');
  const body=JSON.parse(String(requests[0].init?.body));
  assert.equal(body.model,'gen4.5');assert.equal(body.ratio,'720:1280');assert.equal(body.duration,5);
  const sentHeaders=requests[0].init?.headers as Record<string,string>;
  assert.equal(sentHeaders.Authorization,'Bearer segredo');assert.equal(sentHeaders['X-Runway-Version'],'2024-11-06');
  console.log('✓ Adaptador Runway cria, consulta e valida uma tarefa de vídeo real');
  console.log('✓ Pedido curto usa o mínimo honesto de 5 segundos do provider');
}
run().catch(error=>{console.error(error);process.exit(1)});
