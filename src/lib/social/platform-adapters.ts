import type { SocialPlatform, SocialPost } from './types';

export type PublishContext = { accessToken: string; platformAccountId: string; mediaPath: string; publicMediaUrl?: string };
export type PublishResult = { remoteId: string; status: 'processing' | 'published'; permalink?: string };

async function json(response: Response) {
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || data.error?.code || `Falha HTTP ${response.status}`);
  return data;
}

export async function publishInstagram(post: SocialPost, context: PublishContext): Promise<PublishResult> {
  if (!context.publicMediaUrl) throw new Error('Instagram exige mídia em URL pública HTTPS.');
  const api = `https://graph.facebook.com/v23.0/${context.platformAccountId}`;
  const caption = `${post.caption}\n\n${post.hashtags.join(' ')}`.trim();
  const isVideo = /\.(mp4|mov|webm)$/i.test(context.mediaPath);
  const creation = await json(await fetch(`${api}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: context.accessToken, caption, ...(isVideo ? { media_type: 'REELS', video_url: context.publicMediaUrl } : { image_url: context.publicMediaUrl }) }) }));
  return { remoteId: creation.id, status: 'processing' };
}

export async function finishInstagram(containerId: string, context: PublishContext): Promise<PublishResult> {
  const api = `https://graph.facebook.com/v23.0/${context.platformAccountId}/media_publish`;
  const result = await json(await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: context.accessToken, creation_id: containerId }) }));
  return { remoteId: result.id, status: 'published', permalink: `https://www.instagram.com/p/${result.id}` };
}

export function adapterAvailability(platform: SocialPlatform) {
  if (platform === 'instagram') return { implemented: true, reason: 'Instagram Content Publishing API' };
  if (platform === 'tiktok') return { implemented: true, reason: 'TikTok Content Posting API' };
  if (platform === 'shopee') return { implemented: false, reason: 'Publicação no feed de afiliados requer aprovação/API específica da Shopee.' };
  return { implemented: false, reason: 'Plataforma fora do escopo atual.' };
}
