import { db } from '../../storage/db';
import { generateOpenAIImage, generateOpenAIText, generateOpenAIVoice } from '../providers/openai-provider';
import { generateRunwayVideo } from '../providers/runway-provider';

// O Profile Dark opera em modo gratuito por padrão. Só recursos explicitamente
// gratuitos/local são autorizados; chaves antigas permanecem inativas.
const FREE_ONLY_MODE = process.env.FREE_ONLY_MODE !== 'false';
const paidDisabled = <T>(kind: string, startedAt: number): ProviderResult<T> => ({
  success: false,
  provider: 'desativado',
  model: 'modo-gratuito',
  latencyMs: Date.now() - startedAt,
  costCredits: 0,
  error: 'paid_provider_disabled',
  userFriendlyError: `${kind} pago está desativado. O PD está protegido no modo 100% gratuito.`,
});

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  provider: string;
  model: string;
  latencyMs: number;
  costCredits: number;
  error?: string;
  userFriendlyError?: string;
}

export class SmartProviderRouter {
  // --- Text (LLM) ---
  static async generateText(prompt: string, systemPrompt?: string): Promise<ProviderResult<string>> {
    const start = Date.now();
    const primaryProvider = process.env.TEXT_PROVIDER || 'gemini';
    const primaryModel = process.env.TEXT_MODEL || 'gemini-1.5-pro';

    try {
      const hasApiKey = !!(
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.GROQ_API_KEY
      );

      if (!hasApiKey) {
        db.updateProviderHealth('llm', { status: 'not_configured', isConfigured: false, latencyMs: 0, successRate: 0, lastError: 'Nenhuma chave de texto configurada.' });
        return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'provider_not_configured', userFriendlyError: 'Configure uma chave de IA de texto em Integrações antes de gerar.' };
      }

      if (process.env.OPENAI_API_KEY?.startsWith('test-key-')) {
        return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de texto ainda precisa ser validado em Integrações.' };
      }

      if (FREE_ONLY_MODE) return paidDisabled('O gerador de texto por API', start);

      if (process.env.OPENAI_API_KEY && (primaryProvider.toLowerCase() === 'openai' || (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GROQ_API_KEY))) {
        const openAIModel = process.env.OPENAI_TEXT_MODEL || (primaryProvider.toLowerCase() === 'openai' ? process.env.TEXT_MODEL : undefined);
        const result = await generateOpenAIText({ apiKey: process.env.OPENAI_API_KEY, prompt, systemPrompt, model: openAIModel });
        const latencyMs = Date.now() - start;
        db.updateProviderHealth('llm', { latencyMs, status: 'operational', successRate: 100, isConfigured: true, lastError: undefined });
        return { success: true, data: result.text, provider: 'openai', model: result.model, latencyMs, costCredits: 2 };
      }

      db.updateProviderHealth('llm', {
        latencyMs: 0,
        status: 'degraded',
        successRate: 0,
        isConfigured: true,
        lastError: 'Chave encontrada, mas o adaptador de texto ainda não foi validado.',
      });
      return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de texto ainda precisa ser validado em Integrações.' };
    } catch (err: any) {
      db.updateProviderHealth('llm', {
        status: 'degraded',
        lastError: err.message,
      });
      return {
        success: false,
        provider: primaryProvider,
        model: primaryModel,
        latencyMs: Date.now() - start,
        costCredits: 0,
        error: err.message,
        userFriendlyError: 'A geração de texto falhou. Confira a chave, o saldo e o modelo configurado antes de tentar novamente.',
      };
    }
  }

  // --- Image (FLUX, Fal, Replicate, Stability) ---
  static async generateImage(prompt: string, referenceUrl?: string): Promise<ProviderResult<{ url: string }>> {
    const start = Date.now();
    const primaryProvider = process.env.IMAGE_PROVIDER_PRIMARY || 'fal';
    const primaryModel = process.env.IMAGE_MODEL_PRIMARY || 'flux-pro/v1.1-ultra';

    const hasImageKey = !!(process.env.FAL_KEY || process.env.REPLICATE_API_TOKEN || process.env.STABILITY_API_KEY || process.env.OPENAI_API_KEY);
    if (!hasImageKey) {
      db.updateProviderHealth('image', { status: 'not_configured', isConfigured: false, latencyMs: 0, successRate: 0, lastError: 'Nenhuma chave de imagem configurada.' });
      return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'provider_not_configured', userFriendlyError: 'Configure um provider de imagem antes de gerar a imagem mestre.' };
    }

    if (process.env.OPENAI_API_KEY?.startsWith('test-key-')) {
      return { success: false, provider: 'openai', model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de imagem ainda precisa ser validado em Integrações.' };
    }

    if (FREE_ONLY_MODE) return paidDisabled('O gerador de imagem por API', start);

    try {
      if (process.env.OPENAI_API_KEY && (primaryProvider.toLowerCase() === 'openai' || (!process.env.FAL_KEY && !process.env.REPLICATE_API_TOKEN && !process.env.STABILITY_API_KEY))) {
        if (referenceUrl) return { success: false, provider: 'openai', model: process.env.IMAGE_MODEL_PRIMARY || 'gpt-image-1', latencyMs: Date.now() - start, costCredits: 0, error: 'reference_not_supported', userFriendlyError: 'Este adaptador gera imagens por prompt; remova a referência visual ou configure um provider com edição por referência.' };
        const openAIModel = process.env.OPENAI_IMAGE_MODEL || (primaryProvider.toLowerCase() === 'openai' ? process.env.IMAGE_MODEL_PRIMARY : undefined);
        const result = await generateOpenAIImage({ apiKey: process.env.OPENAI_API_KEY, prompt, model: openAIModel });
        const latencyMs = Date.now() - start;
        db.updateProviderHealth('image', { latencyMs, status: 'operational', successRate: 100, isConfigured: true, lastError: undefined });
        return { success: true, data: { url: result.url }, provider: 'openai', model: result.model, latencyMs, costCredits: 10 };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha desconhecida na OpenAI.';
      db.updateProviderHealth('image', { status: 'degraded', isConfigured: true, successRate: 0, lastError: message });
      return { success: false, provider: 'openai', model: process.env.IMAGE_MODEL_PRIMARY || 'gpt-image-1', latencyMs: Date.now() - start, costCredits: 0, error: message, userFriendlyError: 'A OpenAI não conseguiu gerar a imagem. Confira a chave, o saldo e o modelo configurado.' };
    }
    db.updateProviderHealth('image', { latencyMs: 0, status: 'degraded', successRate: 0, isConfigured: true, lastError: 'Chave encontrada, mas o adaptador de imagem ainda não foi validado.' });
    return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de imagem ainda precisa ser validado em Integrações.' };
  }

  // --- Video (Runway Gen-3, Luma, Kling) ---
  static async generateVideo(params: {
    prompt: string;
    imageUrl?: string;
    durationSeconds: number;
    isSmokeTest?: boolean;
    aspectRatio?: string;
  }): Promise<ProviderResult<{ videoUrl: string; thumbnailUrl: string; actualDurationSeconds?: number; providerTaskId?: string }>> {
    const start = Date.now();
    const primaryProvider = process.env.VIDEO_PROVIDER_PRIMARY || 'runway';
    const primaryModel = process.env.VIDEO_MODEL_PRIMARY || 'gen3a_turbo';

    const hasVideoKey = !!(process.env.RUNWAY_API_KEY || process.env.LUMA_API_KEY || process.env.KLING_API_KEY);
    if (!hasVideoKey) {
      db.updateProviderHealth('video', { status: 'not_configured', isConfigured: false, latencyMs: 0, successRate: 0, lastError: 'Nenhuma chave de vídeo configurada.' });
      return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'provider_not_configured', userFriendlyError: 'Configure Runway, Luma ou Kling antes de executar o teste rápido de vídeo.' };
    }

    if (process.env.RUNWAY_API_KEY?.startsWith('test-key-')) {
      return { success: false, provider: 'runway', model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de vídeo ainda precisa ser validado em Integrações.' };
    }

    if (FREE_ONLY_MODE) return paidDisabled('O gerador de vídeo por API', start);

    try {
      if (process.env.RUNWAY_API_KEY && (primaryProvider.toLowerCase() === 'runway' || (!process.env.LUMA_API_KEY && !process.env.KLING_API_KEY))) {
        const model = process.env.RUNWAY_VIDEO_MODEL || (primaryProvider.toLowerCase() === 'runway' ? process.env.VIDEO_MODEL_PRIMARY : undefined);
        const result = await generateRunwayVideo({ apiKey: process.env.RUNWAY_API_KEY, prompt: params.prompt, imageUrl: params.imageUrl, durationSeconds: params.durationSeconds, aspectRatio: params.aspectRatio, model });
        const latencyMs = Date.now() - start;
        db.updateProviderHealth('video', { latencyMs, status: 'operational', successRate: 100, isConfigured: true, lastError: undefined });
        return { success: true, data: { videoUrl: result.videoUrl, thumbnailUrl: params.imageUrl || result.videoUrl, actualDurationSeconds: result.actualDurationSeconds, providerTaskId: result.taskId }, provider: 'runway', model: result.model, latencyMs, costCredits: params.isSmokeTest ? 5 : 25 };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha desconhecida na Runway.';
      db.updateProviderHealth('video', { status: 'degraded', isConfigured: true, successRate: 0, lastError: message });
      return { success: false, provider: 'runway', model: process.env.RUNWAY_VIDEO_MODEL || 'gen4.5', latencyMs: Date.now() - start, costCredits: 0, error: message, userFriendlyError: 'A Runway não concluiu o vídeo. Confira a chave, o saldo, a mídia de referência e o status da tarefa.' };
    }
    db.updateProviderHealth('video', { latencyMs: 0, status: 'degraded', successRate: 0, isConfigured: true, lastError: 'Chave encontrada, mas o adaptador de vídeo ainda não foi validado.' });
    return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de vídeo ainda precisa ser validado em Integrações.' };
  }

  // --- Voice / TTS (ElevenLabs, OpenAI) ---
  static async generateVoice(text: string, voiceName: string): Promise<ProviderResult<{ audioUrl: string }>> {
    const start = Date.now();
    const primaryProvider = process.env.VOICE_PROVIDER || 'elevenlabs';
    const primaryModel = process.env.VOICE_MODEL || 'eleven_multilingual_v2';

    const hasVoiceKey = !!(process.env.ELEVENLABS_API_KEY || process.env.OPENAI_API_KEY);
    if (!hasVoiceKey) {
      db.updateProviderHealth('voice', { status: 'not_configured', isConfigured: false, latencyMs: 0, successRate: 0, lastError: 'Nenhuma chave de voz configurada.' });
      return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'provider_not_configured', userFriendlyError: 'Configure ElevenLabs ou OpenAI antes de gerar voz.' };
    }

    if (process.env.OPENAI_API_KEY?.startsWith('test-key-')) {
      return { success: false, provider: 'openai', model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de voz ainda precisa ser validado em Integrações.' };
    }

    if (FREE_ONLY_MODE) return paidDisabled('O gerador de voz por API', start);

    try {
      if (process.env.OPENAI_API_KEY && (primaryProvider.toLowerCase() === 'openai' || !process.env.ELEVENLABS_API_KEY)) {
        const supported = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
        const requested = voiceName.toLowerCase().trim();
        const voice = supported.includes(requested) ? requested : (process.env.OPENAI_VOICE || 'alloy');
        const openAIModel = process.env.OPENAI_VOICE_MODEL || (primaryProvider.toLowerCase() === 'openai' ? process.env.VOICE_MODEL : undefined);
        const result = await generateOpenAIVoice({ apiKey: process.env.OPENAI_API_KEY, text, voice, model: openAIModel });
        const latencyMs = Date.now() - start;
        db.updateProviderHealth('voice', { latencyMs, status: 'operational', successRate: 100, isConfigured: true, lastError: undefined });
        return { success: true, data: { audioUrl: result.audioUrl }, provider: 'openai', model: result.model, latencyMs, costCredits: 5 };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha desconhecida na OpenAI.';
      db.updateProviderHealth('voice', { status: 'degraded', isConfigured: true, successRate: 0, lastError: message });
      return { success: false, provider: 'openai', model: process.env.VOICE_MODEL || 'gpt-4o-mini-tts', latencyMs: Date.now() - start, costCredits: 0, error: message, userFriendlyError: 'A OpenAI não conseguiu gerar a voz. Confira a chave, o saldo e o modelo configurado.' };
    }
    db.updateProviderHealth('voice', { latencyMs: 0, status: 'degraded', successRate: 0, isConfigured: true, lastError: 'Chave encontrada, mas o adaptador de voz ainda não foi validado.' });
    return { success: false, provider: primaryProvider, model: primaryModel, latencyMs: Date.now() - start, costCredits: 0, error: 'adapter_not_validated', userFriendlyError: 'A chave foi encontrada, mas o adaptador de voz ainda precisa ser validado em Integrações.' };
  }
}
