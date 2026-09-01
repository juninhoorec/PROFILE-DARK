import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { db } from '@/lib/storage/db';
import { assertSafeUrl } from '@/lib/affiliate/resolver';
import { createProductVideoPlan } from '@/lib/ai/product-video-planner';
import { generateLongCatAvatar } from '@/lib/ai/providers/longcat-provider';
import { localUploadPath, newUploadPath, runProcess, uploadsDirectory } from '@/lib/local-media';

export type ProductVideoJob = {
  id: string;
  profileId: string;
  productId: string;
  status: 'queued' | 'preparing' | 'generating' | 'waiting' | 'joining' | 'completed' | 'failed';
  progress: number;
  currentScene: number;
  message: string;
  resolution: '480p' | '720p';
  plan: ReturnType<typeof createProductVideoPlan>;
  sceneUrls: string[];
  finalUrl?: string;
  error?: string;
  attempts: number;
  nextRetryAt?: string;
  engine?: 'longcat-scenes';
  createdAt: string;
  updatedAt: string;
};

const jobsDirectory = path.join(process.cwd(), 'data', 'product-video-jobs');
const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
const activeJobs = new Set<string>();

async function saveJob(job: ProductVideoJob) {
  job.updatedAt = new Date().toISOString();
  await fs.mkdir(jobsDirectory, { recursive: true });
  await fs.writeFile(path.join(jobsDirectory, `${job.id}.json`), JSON.stringify(job, null, 2));
}

export async function getProductVideoJob(id: string) {
  if (!/^pv_[a-z0-9-]+$/i.test(id)) return undefined;
  try { return JSON.parse(await fs.readFile(path.join(jobsDirectory, `${id}.json`), 'utf8')) as ProductVideoJob; }
  catch { return undefined; }
}

async function synthesizeScene(text: string, output: string) {
  const textFile = path.join(jobsDirectory, `speech-${process.pid}-${Date.now()}.txt`);
  const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  try {
    await fs.writeFile(textFile, text, 'utf8');
    await runProcess(powershell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(process.cwd(), 'scripts', 'synthesize-windows-voice.ps1'), '-TextFile', textFile, '-OutputFile', output, '-Voice', process.env.LOCAL_TTS_VOICE || 'Microsoft Maria Desktop', '-Rate', '2']);
  } finally {
    await fs.unlink(textFile).catch(() => undefined);
  }
}

async function fetchProductImage(url?: string) {
  if (!url) return undefined;
  const parsed = new URL(url);
  await assertSafeUrl(parsed);
  const response = await fetch(parsed, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'ProfileDark/1.0' } });
  if (!response.ok) return undefined;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > 12_000_000) throw new Error('A imagem do produto é grande demais.');
  return bytes;
}

async function prepareReference(profileImage: string, productImage: Buffer | undefined, output: string) {
  const base = sharp(profileImage).resize(720, 1280, { fit: 'cover', position: 'centre' });
  if (!productImage) { await base.jpeg({ quality: 92 }).toFile(output); return; }
  const product = await sharp(productImage).resize(285, 285, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const panel = Buffer.from('<svg width="325" height="325"><rect x="0" y="0" width="325" height="325" rx="28" fill="white" fill-opacity=".94"/></svg>');
  await base.composite([{ input: panel, left: 375, top: 905 }, { input: product, left: 395, top: 925 }]).jpeg({ quality: 94 }).toFile(output);
}

async function lastFrame(video: string, output: string) {
  await runProcess(ffmpeg, ['-y', '-sseof', '-0.08', '-i', video, '-frames:v', '1', '-q:v', '2', output], 60_000);
}

async function joinScenes(inputs: string[], output: string) {
  const args = ['-y'];
  inputs.forEach((file) => args.push('-i', file));
  const streams = inputs.map((_, index) => `[${index}:v:0][${index}:a:0]`).join('');
  args.push('-filter_complex', `${streams}concat=n=${inputs.length}:v=1:a=1[v][a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-t', '20', output);
  await runProcess(ffmpeg, args, 300_000);
}

export async function createAndStartProductVideoJob(profileId: string, productId: string, resolution: '480p' | '720p') {
  const profile = db.getProfileById(profileId);
  const product = db.getProductById(productId);
  if (!profile || !product) throw new Error('Profile ou produto não encontrado.');
  const job: ProductVideoJob = { id: `pv_${randomUUID()}`, profileId, productId, status: 'queued', progress: 2, currentScene: 0, message: 'Aguardando preparação do projeto gratuito…', resolution, plan: createProductVideoPlan(profile, product), sceneUrls: [], attempts: 0, engine: 'longcat-scenes', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await saveJob(job);
  setTimeout(() => { void processProductVideoJob(job.id); }, 10);
  return job;
}

export async function processProductVideoJob(id: string) {
  const job = await getProductVideoJob(id);
  if (!job || job.status === 'completed' || activeJobs.has(id)) return;
  if (job.status === 'waiting' && job.nextRetryAt && Date.now() < Date.parse(job.nextRetryAt)) return;
  const profile = db.getProfileById(job.profileId);
  const product = db.getProductById(job.productId);
  if (!profile || !product) return;
  const work = path.join(jobsDirectory, job.id);
  activeJobs.add(id);
  try {
    await fs.mkdir(work, { recursive: true });
    job.status = 'preparing'; job.progress = 5; job.message = 'Preparando personagem e produto…'; await saveJob(job);
    const avatarPath = await localUploadPath(profile.avatarUrl, ['png', 'jpg', 'jpeg', 'webp']);
    const reference = path.join(work, 'reference-0.jpg');
    await prepareReference(avatarPath, await fetchProductImage(product.imageUrl).catch(() => undefined), reference);
    let currentReference = reference;
    const clips = await Promise.all(job.sceneUrls.map((url) => localUploadPath(url, ['mp4'])));
    if (clips.length) {
      currentReference = path.join(work, `reference-resume-${clips.length}.jpg`);
      await lastFrame(clips[clips.length - 1], currentReference);
    }
    const sceneCount = job.plan.scenes.length;
    const progressPerScene = 84 / sceneCount;
    for (const scene of job.plan.scenes.slice(clips.length)) {
      job.status = 'generating'; job.currentScene = scene.number; job.progress = Math.round(8 + (scene.number - 1) * progressPerScene); job.message = `Gerando cena ${scene.number} de ${sceneCount}: ${scene.title}`; await saveJob(job);
      const audio = path.join(work, `scene-${scene.number}.wav`);
      await synthesizeScene(scene.narration, audio);
      const clipAsset = await newUploadPath('mp4');
      await generateLongCatAvatar({ imagePath: currentReference, audioPath: audio, prompt: scene.motionPrompt, resolution: job.resolution, seed: 4200 + scene.number * 137, outputPath: clipAsset.file });
      clips.push(clipAsset.file); job.sceneUrls.push(clipAsset.url); job.attempts = 0; job.nextRetryAt = undefined; job.progress = Math.round(8 + scene.number * progressPerScene); await saveJob(job);
      if (scene.number < sceneCount) {
        const nextReference = path.join(work, `reference-${scene.number}.jpg`);
        await lastFrame(clipAsset.file, nextReference);
        currentReference = nextReference;
      }
    }
    job.status = 'joining'; job.progress = 94; job.message = 'Unindo as cinco cenas e conferindo o vídeo final…'; await saveJob(job);
    const finalAsset = await newUploadPath('mp4');
    await joinScenes(clips, finalAsset.file);
    const stats = await fs.stat(finalAsset.file);
    job.status = 'completed'; job.progress = 100; job.currentScene = sceneCount; job.finalUrl = finalAsset.url; job.message = 'Vídeo final de 20 segundos concluído.'; await saveJob(job);
    db.saveLibraryItem({ id: `lib_product_video_${finalAsset.id}`, title: job.plan.title, profileName: profile.name, profileAvatarUrl: profile.avatarUrl, productName: product.name, thumbnailUrl: profile.avatarUrl, videoUrl: finalAsset.url, duration: '00:20', resolution: job.resolution, status: 'concluido', createdAt: new Date().toISOString(), tags: [profile.name, product.name, 'LongCat Avatar 1.5', 'vídeo de produto', '20 segundos'], fileSizeMb: Math.round(stats.size / 104857.6) / 10 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'A geração não foi concluída.';
    const retriable = /cota|quota|ocupada|fila|demorou|timeout|temporariamente|servidor|GPU|429|502|503|504/i.test(message);
    if (retriable) {
      job.status = 'waiting'; job.attempts += 1;
      const delay = Math.min(30 * 60_000, 5 * 60_000 * Math.max(1, job.attempts));
      job.nextRetryAt = new Date(Date.now() + delay).toISOString();
      job.message = `Progresso da cena ${Math.max(1, job.currentScene)} preservado. A GPU gratuita está sem vaga ou cota; o PD tentará novamente automaticamente.`;
      job.error = undefined;
      await saveJob(job);
      setTimeout(() => { void processProductVideoJob(id); }, delay + 1000);
    } else {
      job.status = 'failed'; job.error = message; job.message = message; await saveJob(job);
    }
  } finally {
    activeJobs.delete(id);
  }
}

export async function resumeProductVideoJob(id: string) {
  const job = await getProductVideoJob(id);
  if (job && ['queued', 'waiting', 'preparing', 'generating', 'joining'].includes(job.status)) setTimeout(() => { void processProductVideoJob(id); }, 10);
  return job;
}
