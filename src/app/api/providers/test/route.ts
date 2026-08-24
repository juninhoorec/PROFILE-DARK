import { NextResponse } from 'next/server';
import { SmartProviderRouter } from '@/lib/ai/router/smart-provider-router';
import { db } from '@/lib/storage/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service } = body; // 'llm' | 'image' | 'voice' | 'video'

    if (service === 'llm') {
      const res = await SmartProviderRouter.generateText('Teste de conectividade LLM');
      return NextResponse.json({ result: res });
    } else if (service === 'image') {
      const res = await SmartProviderRouter.generateImage('Teste de conectividade Image');
      return NextResponse.json({ result: res });
    } else if (service === 'voice') {
      const res = await SmartProviderRouter.generateVoice('Teste de voz', 'Luna (Natural)');
      return NextResponse.json({ result: res });
    } else if (service === 'video') {
      const res = await SmartProviderRouter.generateVideo({
        prompt: 'Teste controlado de vídeo de 3 segundos',
        durationSeconds: 3,
        isSmokeTest: true,
      });
      return NextResponse.json({ result: res });
    }

    return NextResponse.json({ error: 'Serviço não especificado.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
