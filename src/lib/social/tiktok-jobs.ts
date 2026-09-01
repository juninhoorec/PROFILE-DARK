import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const FILE = path.join(process.cwd(), 'data', 'tiktok-publish-jobs.json');
export type TikTokJob = { id: string; accountId: string; mediaId: string; publishId?: string; status: 'authorized'|'sending'|'processing'|'published'|'error'; error?: string; postIds?: string[]; createdAt: string; updatedAt: string };
const load = (): TikTokJob[] => { try { const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8')); return Array.isArray(parsed) ? parsed : []; } catch { return []; } };
const save = (jobs: TikTokJob[]) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); const temp = `${FILE}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(jobs, null, 2)); fs.renameSync(temp, FILE); };
export function createTikTokJob(accountId: string, mediaId: string) { const now = new Date().toISOString(), job: TikTokJob = { id: `ttp_${randomUUID()}`, accountId, mediaId, status: 'authorized', createdAt: now, updatedAt: now }; const jobs = load(); jobs.unshift(job); save(jobs); return job; }
export function updateTikTokJob(id: string, update: Partial<TikTokJob>) { const jobs = load(), index = jobs.findIndex((item) => item.id === id); if (index < 0) throw new Error('Publicação TikTok não encontrada.'); jobs[index] = { ...jobs[index], ...update, updatedAt: new Date().toISOString() }; save(jobs); return jobs[index]; }
export function getTikTokJob(id: string) { return load().find((item) => item.id === id); }
