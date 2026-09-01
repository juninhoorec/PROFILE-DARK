import { persistGeneratedAsset } from '../../storage/generated-assets';

type Fetcher = typeof fetch;

function errorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return `OpenAI respondeu com HTTP ${status}.`;
}

async function jsonRequest<T>(apiKey: string, path: string, body: unknown, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(`https://api.openai.com/v1${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw new Error(errorMessage(payload, response.status));
  return payload as T;
}

export async function generateOpenAIText(params: {
  apiKey: string; prompt: string; systemPrompt?: string; model?: string; fetcher?: Fetcher;
}) {
  const model = params.model || 'gpt-5';
  const payload = await jsonRequest<{
    output_text?: string;
    output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  }>(params.apiKey, '/responses', {
    model,
    instructions: params.systemPrompt || undefined,
    input: params.prompt,
  }, params.fetcher || fetch);
  const text = payload.output_text || payload.output?.flatMap(item => item.content || [])
    .find(content => content.type === 'output_text' && content.text)?.text;
  if (!text?.trim()) throw new Error('A OpenAI não devolveu texto utilizável.');
  return { text: text.trim(), model };
}

export async function generateOpenAIImage(params: {
  apiKey: string; prompt: string; model?: string; fetcher?: Fetcher;
}) {
  const model = params.model || 'gpt-image-1';
  const payload = await jsonRequest<{ data?: Array<{ b64_json?: string; url?: string }> }>(
    params.apiKey,
    '/images/generations',
    { model, prompt: params.prompt, size: '1024x1024', n: 1 },
    params.fetcher || fetch,
  );
  const image = payload.data?.[0];
  if (image?.b64_json) {
    const asset = await persistGeneratedAsset(Buffer.from(image.b64_json, 'base64'), 'png');
    return { url: asset.url, model };
  }
  if (image?.url && /^https:\/\//i.test(image.url)) return { url: image.url, model };
  throw new Error('A OpenAI não devolveu uma imagem utilizável.');
}

export async function generateOpenAIVoice(params: {
  apiKey: string; text: string; voice?: string; model?: string; fetcher?: Fetcher;
}) {
  const model = params.model || 'gpt-4o-mini-tts';
  const response = await (params.fetcher || fetch)('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${params.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: params.text.slice(0, 4096), voice: params.voice || 'alloy', response_format: 'mp3' }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(errorMessage(payload, response.status));
  }
  const asset = await persistGeneratedAsset(new Uint8Array(await response.arrayBuffer()), 'mp3');
  return { audioUrl: asset.url, model };
}
