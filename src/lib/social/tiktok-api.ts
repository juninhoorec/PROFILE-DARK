import fs from 'node:fs';
import path from 'node:path';
import { getValidTikTokAccessToken } from './tiktok-auth';
import { scanProfileMedia } from './social-engine';

const API = 'https://open.tiktokapis.com';
export type TikTokPrivacy = 'PUBLIC_TO_EVERYONE'|'FOLLOWER_OF_CREATOR'|'MUTUAL_FOLLOW_FRIENDS'|'SELF_ONLY';
export type TikTokCreatorInfo = { creator_avatar_url: string; creator_username: string; creator_nickname: string; privacy_level_options: TikTokPrivacy[]; comment_disabled: boolean; duet_disabled: boolean; stitch_disabled: boolean; max_video_post_duration_sec: number };
export type TikTokPublishSettings = { title: string; privacyLevel: TikTokPrivacy; disableComment: boolean; disableDuet: boolean; disableStitch: boolean; videoCoverTimestampMs?: number };

async function apiJson(response: Response) {
  const result = await response.json(); const error = result.error;
  if (!response.ok || (error && error.code && error.code !== 'ok')) throw new Error(error?.message || error?.code || `TikTok respondeu HTTP ${response.status}.`);
  return result;
}

async function authorizedPost(endpoint: string, accessToken: string, body?: object) {
  return apiJson(await fetch(`${API}${endpoint}`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' }, ...(body ? { body: JSON.stringify(body) } : {}) }));
}

export async function queryTikTokCreatorInfo(accountId: string): Promise<TikTokCreatorInfo> {
  const { accessToken } = await getValidTikTokAccessToken(accountId); const result = await authorizedPost('/v2/post/publish/creator_info/query/', accessToken); return result.data;
}

export function resolveTikTokMedia(mediaId: string) {
  const media = scanProfileMedia().find((item) => item.id === mediaId); if (!media) throw new Error('Vídeo não encontrado na biblioteca.');
  if (media.kind !== 'video' || path.extname(media.fileName).toLowerCase() !== '.mp4') throw new Error('O Direct Post aceita somente vídeo MP4 neste fluxo.');
  const file = path.resolve(process.cwd(), 'video e imagem do perfil', media.folder, media.relativeFolder === 'Geral' ? '' : media.relativeFolder, media.fileName);
  const root = path.resolve(process.cwd(), 'video e imagem do perfil') + path.sep; if (!file.startsWith(root) || !fs.existsSync(file)) throw new Error('Arquivo de vídeo indisponível.');
  return { media, file, size: fs.statSync(file).size };
}

function chunksFor(size: number) {
  const max = 64 * 1024 * 1024; if (size <= max) return { chunkSize: size, count: 1 };
  const count = Math.ceil(size / max); return { chunkSize: max, count };
}

async function uploadChunks(uploadUrl: string, file: string, size: number, chunkSize: number) {
  const handle = await fs.promises.open(file, 'r');
  try {
    for (let start = 0; start < size; start += chunkSize) {
      const end = Math.min(start + chunkSize, size), buffer = Buffer.alloc(end - start); await handle.read(buffer, 0, buffer.length, start);
      const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(buffer.length), 'Content-Range': `bytes ${start}-${end - 1}/${size}` }, body: buffer });
      if (!response.ok) throw new Error(`O TikTok recusou o trecho ${start}-${end - 1} do vídeo (HTTP ${response.status}).`);
    }
  } finally { await handle.close(); }
}

export async function directPostTikTok(accountId: string, mediaId: string, requested: TikTokPublishSettings, onStage?: (stage: 'authorized'|'sending'|'processing') => void) {
  const { accessToken } = await getValidTikTokAccessToken(accountId); onStage?.('authorized');
  const creator = await queryTikTokCreatorInfo(accountId); if (!creator.privacy_level_options.includes(requested.privacyLevel)) throw new Error('A privacidade escolhida não está disponível para esta conta.');
  const { file, size } = resolveTikTokMedia(mediaId), { chunkSize, count } = chunksFor(size);
  const postInfo = { title: requested.title.slice(0, 2200), privacy_level: requested.privacyLevel, disable_comment: creator.comment_disabled || requested.disableComment, disable_duet: creator.duet_disabled || requested.disableDuet, disable_stitch: creator.stitch_disabled || requested.disableStitch, video_cover_timestamp_ms: Math.max(0, requested.videoCoverTimestampMs || 0) };
  const initialized = await authorizedPost('/v2/post/publish/video/init/', accessToken, { post_info: postInfo, source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunkSize, total_chunk_count: count } });
  if (!initialized.data?.upload_url || !initialized.data?.publish_id) throw new Error('O TikTok não retornou os dados de upload.');
  onStage?.('sending'); await uploadChunks(initialized.data.upload_url, file, size, chunkSize); onStage?.('processing');
  return { publishId: initialized.data.publish_id as string, creator, postInfo };
}

export async function fetchTikTokPublishStatus(accountId: string, publishId: string) {
  const { accessToken } = await getValidTikTokAccessToken(accountId); const result = await authorizedPost('/v2/post/publish/status/fetch/', accessToken, { publish_id: publishId }); return result.data as { status: 'PROCESSING_UPLOAD'|'PROCESSING_DOWNLOAD'|'PUBLISH_COMPLETE'|'FAILED'; fail_reason?: string; publicaly_available_post_id?: string[]; uploaded_bytes?: number };
}
