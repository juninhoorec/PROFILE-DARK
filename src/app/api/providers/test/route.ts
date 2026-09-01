import { NextResponse } from 'next/server';
import { SmartProviderRouter } from '@/lib/ai/router/smart-provider-router';
import { db } from '@/lib/storage/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service } = body; // 'llm' | 'image' | 'voice' | 'video'

    if (service === 'llm') {
      const res = await SmartProviderRouter.generateText('Teste de conectividade LLM');
      return NextResponse.json({ result: res }, {status:res.success?200:503});
    } else if (service === 'image') {
      const res = await SmartProviderRouter.generateImage('Teste de conectividade Image');
      return NextResponse.json({ result: res }, {status:res.success?200:503});
    } else if (service === 'voice') {
      const res = await SmartProviderRouter.generateVoice('Teste de voz', 'Luna (Natural)');
      return NextResponse.json({ result: res }, {status:res.success?200:503});
    } else if (service === 'video' || service === 'render') {
      const res = await SmartProviderRouter.generateVideo({
        prompt: 'Teste controlado de vídeo curto de 5 segundos',
        durationSeconds: 5,
        isSmokeTest: true,
      });
      return NextResponse.json({ result: res }, {status:res.success?200:503});
    } else if(service==='talking_head') {
      const video=await SmartProviderRouter.generateVideo({prompt:'Teste controlado de talking head',durationSeconds:5,isSmokeTest:true});
      const voice=await SmartProviderRouter.generateVoice('Teste de voz','Voz de teste');
      const success=video.success&&voice.success;
      return NextResponse.json({result:{success,video,voice,userFriendlyError:success?undefined:'Talking Head exige vídeo e voz operacionais.'}},{status:success?200:503});
    } else if(service==='storage') {
      const health=db.getProviderHealth().find(item=>item.service==='storage');
      return NextResponse.json({result:{success:health?.status==='operational',provider:'storage local',costCredits:0}});
    }

    return NextResponse.json({ error: 'Serviço não especificado.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
