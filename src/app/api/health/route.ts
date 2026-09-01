import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { SystemDoctor } from '@/lib/ai/doctor/system-doctor';

export async function GET() {
  try {
    const configuration = {
      llm: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY),
      image: Boolean(process.env.FAL_KEY || process.env.REPLICATE_API_TOKEN || process.env.STABILITY_API_KEY || process.env.OPENAI_API_KEY),
      voice: Boolean(process.env.ELEVENLABS_API_KEY || process.env.OPENAI_API_KEY),
      video: Boolean(process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY || process.env.KLING_API_KEY),
      talking_head: Boolean((process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY || process.env.KLING_API_KEY) && (process.env.ELEVENLABS_API_KEY || process.env.OPENAI_API_KEY)),
      render: Boolean(process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY || process.env.KLING_API_KEY),
    };
    const currentHealth=db.getProviderHealth();
    for (const [service, configured] of Object.entries(configuration)) {
      const current=currentHealth.find(item=>item.service===service);
      if(configured&&current?.isConfigured&&current.status==='operational')continue;
      db.updateProviderHealth(service as 'llm' | 'image' | 'voice' | 'video' | 'talking_head' | 'render', {
        isConfigured: configured,
        status: configured ? 'degraded' : 'not_configured',
        latencyMs: 0,
        successRate: 0,
        lastError: configured ? 'Aguardando teste real de conectividade.' : 'Credencial não configurada.',
      });
    }
    const health = db.getProviderHealth();
    const diagnosis = SystemDoctor.diagnose();

    return NextResponse.json({
      app: 'healthy',
      database: 'healthy',
      storage: 'healthy',
      text: health.find((h) => h.service === 'llm')?.status === 'operational' ? 'healthy' : 'degraded',
      image: health.find((h) => h.service === 'image')?.status === 'operational' ? 'healthy' : 'degraded',
      voice: health.find((h) => h.service === 'voice')?.status === 'operational' ? 'healthy' : 'degraded',
      video: health.find((h) => h.service === 'video')?.status === 'operational' ? 'healthy' : 'degraded',
      details: health,
      activeProviders: {
        llm: process.env.GEMINI_API_KEY ? `Gemini · ${process.env.TEXT_MODEL||'modelo configurado'}` : process.env.ANTHROPIC_API_KEY ? 'Anthropic · adaptador pendente' : process.env.GROQ_API_KEY ? 'Groq · adaptador pendente' : process.env.OPENAI_API_KEY ? `OpenAI · ${process.env.OPENAI_TEXT_MODEL||'gpt-5'}` : 'Nenhum',
        image: process.env.FAL_KEY ? `Fal · ${process.env.IMAGE_MODEL_PRIMARY||'modelo configurado'}` : process.env.REPLICATE_API_TOKEN ? 'Replicate · adaptador pendente' : process.env.STABILITY_API_KEY ? 'Stability · adaptador pendente' : process.env.OPENAI_API_KEY ? `OpenAI · ${process.env.OPENAI_IMAGE_MODEL||'gpt-image-1'}` : 'Nenhum',
        voice: process.env.ELEVENLABS_API_KEY ? `ElevenLabs · ${process.env.VOICE_MODEL||'modelo configurado'}` : process.env.OPENAI_API_KEY ? `OpenAI · ${process.env.OPENAI_VOICE_MODEL||'gpt-4o-mini-tts'}` : 'Nenhum',
        video: process.env.RUNWAY_API_KEY ? `Runway · ${process.env.RUNWAY_VIDEO_MODEL||'gen4.5'}` : process.env.LUMA_API_KEY ? 'Luma · modelo configurado' : process.env.KLING_API_KEY ? 'Kling · modelo configurado' : 'Nenhum',
      },
      diagnosis,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        app: 'unhealthy',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
