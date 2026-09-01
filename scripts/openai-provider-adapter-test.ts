import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateOpenAIImage, generateOpenAIText, generateOpenAIVoice } from '../src/lib/ai/providers/openai-provider';

async function run() {
  const requests: Array<{ url:string; init?:RequestInit }> = [];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const url=String(input); requests.push({url,init});
    if(url.endsWith('/responses')) return new Response(JSON.stringify({output_text:'Roteiro real do adapter'}),{status:200,headers:{'Content-Type':'application/json'}});
    if(url.endsWith('/images/generations')) return new Response(JSON.stringify({data:[{b64_json:Buffer.from('imagem-binaria').toString('base64')}]}),{status:200,headers:{'Content-Type':'application/json'}});
    if(url.endsWith('/audio/speech')) return new Response(Buffer.from('audio-binario'),{status:200,headers:{'Content-Type':'audio/mpeg'}});
    return new Response(JSON.stringify({error:{message:'Endpoint inesperado'}}),{status:404});
  }) as typeof fetch;

  const text=await generateOpenAIText({apiKey:'segredo',prompt:'Crie um roteiro',systemPrompt:'Seja direto',fetcher});
  assert.equal(text.text,'Roteiro real do adapter');
  const textBody=JSON.parse(String(requests[0].init?.body));
  assert.equal(textBody.model,'gpt-5');
  assert.equal(textBody.instructions,'Seja direto');
  assert.equal((requests[0].init?.headers as Record<string,string>).Authorization,'Bearer segredo');

  const image=await generateOpenAIImage({apiKey:'segredo',prompt:'Produto em estúdio',fetcher});
  const voice=await generateOpenAIVoice({apiKey:'segredo',text:'Oferta válida hoje',fetcher});
  assert.match(image.url,/^\/api\/uploads\/[0-9a-f-]{36}\.png$/);
  assert.match(voice.audioUrl,/^\/api\/uploads\/[0-9a-f-]{36}\.mp3$/);
  const imagePath=path.join(process.cwd(),'data','uploads',image.url.split('/').pop()!);
  const voicePath=path.join(process.cwd(),'data','uploads',voice.audioUrl.split('/').pop()!);
  assert.equal((await fs.readFile(imagePath)).toString(),'imagem-binaria');
  assert.equal((await fs.readFile(voicePath)).toString(),'audio-binario');
  await Promise.all([fs.unlink(imagePath),fs.unlink(voicePath)]);
  assert.equal(requests.length,3);
  console.log('✓ Adaptadores OpenAI enviam os contratos oficiais de texto, imagem e voz');
  console.log('✓ Imagem e áudio reais são persistidos e servidos por URLs internas');
}

run().catch(error=>{console.error(error);process.exit(1);});
