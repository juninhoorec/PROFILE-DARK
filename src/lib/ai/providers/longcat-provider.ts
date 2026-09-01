import fs from 'node:fs/promises';
import path from 'node:path';
import { Client, handle_file } from '@gradio/client';

// The official demo currently reserves 240s on an xlarge ZeroGPU (480 quota
// seconds), which locks out free visitors. This inspected community mirror uses
// the same public MIT weights/code with a 120s large-GPU reservation.
const DEFAULT_SPACE = 'virakon/LongCat-Video-Avatar-ZeroGPU';

type RemoteFile = { url?: string | null; path?: string | null };

function findRemoteFile(value: unknown): RemoteFile | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRemoteFile(item);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.url === 'string' || typeof candidate.path === 'string') return candidate as RemoteFile;
    for (const item of Object.values(candidate)) {
      const found = findRemoteFile(item);
      if (found) return found;
    }
  }
  return undefined;
}

function friendlyLongCatError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/quota|gpu quota|exceeded/i.test(raw)) return 'A cota gratuita do Hugging Face terminou por enquanto. Entre em uma conta gratuita ou tente novamente mais tarde.';
  if (/duration.*larger than the maximum|illegal duration/i.test(raw)) return 'Este servidor LongCat reservou mais tempo de GPU do que a modalidade gratuita permite. Use o servidor gratuito alternativo do PD ou configure outro LONGCAT_SPACE.';
  if (/queue|capacity|busy|overloaded/i.test(raw)) return 'A GPU gratuita do LongCat está ocupada. Aguarde alguns minutos e tente novamente.';
  if (/oauth|sign.?in|login|token|unauthorized|401|403/i.test(raw)) return 'O LongCat gratuito pediu autenticação. Configure HF_TOKEN no .env.local com um token gratuito do Hugging Face.';
  if (/timeout|timed out|abort/i.test(raw)) return 'O LongCat demorou além do limite da fila gratuita. Tente novamente em alguns minutos.';
  return `O LongCat não concluiu esta geração: ${raw}`;
}

export async function generateLongCatAvatar(input: {
  imagePath: string;
  audioPath: string;
  prompt: string;
  resolution: '480p' | '720p';
  seed: number;
  outputPath: string;
}) {
  const space = process.env.LONGCAT_SPACE || DEFAULT_SPACE;
  const token = process.env.HF_TOKEN;
  const options = token?.startsWith('hf_') ? { token: token as `hf_${string}` } : undefined;
  const client = await Client.connect(space, options);

  try {
    const officialApi = space === 'meituan-longcat/LongCat-Video-Avatar-1.5-Demo';
    const result = await client.predict(officialApi ? '/generate_avatar' : '/generate', {
      [officialApi ? 'image_file' : 'image_path']: handle_file(input.imagePath),
      [officialApi ? 'audio_file' : 'audio_path']: handle_file(input.audioPath),
      prompt: input.prompt,
      resolution: input.resolution,
      seed: input.seed,
      vocal_mode: 'Clean speech (fast)',
      acceleration: 'DBCache faster',
    });
    const remote = findRemoteFile(result.data);
    let remoteUrl = remote?.url || remote?.path;
    if (!remoteUrl) throw new Error('A resposta não trouxe o arquivo de vídeo.');
    if (remoteUrl.startsWith('/')) {
      const subdomain = space.toLowerCase().replace('/', '-').replace(/\./g, '-');
      remoteUrl = `https://${subdomain}.hf.space${remoteUrl}`;
    }
    const response = await fetch(remoteUrl, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Falha ao baixar o resultado (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 10_000) throw new Error('O vídeo recebido está vazio ou incompleto.');
    await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
    await fs.writeFile(input.outputPath, bytes, { flag: 'wx' });
    return { space, bytes: bytes.byteLength };
  } catch (error) {
    throw new Error(friendlyLongCatError(error));
  } finally {
    client.close();
  }
}
