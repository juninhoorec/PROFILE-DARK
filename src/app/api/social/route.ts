import { NextResponse } from 'next/server';
import { z } from 'zod';
import { associateMediaProduct, generateFourteenDayPlan, getSocialDashboard, refreshSocialIntelligence, scheduleMedia, updatePost } from '@/lib/social/social-engine';
import { ensureSocialScheduler } from '@/lib/social/scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
ensureSocialScheduler();

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('generate_plan'), profileId: z.string().optional() }),
  z.object({ action: z.literal('refresh_intelligence') }),
  z.object({ action: z.literal('associate_media'), mediaId: z.string(), productLinkId: z.string().optional() }),
  z.object({ action: z.literal('schedule_media'), profileId: z.string(), mediaId: z.string(), platform: z.enum(['instagram', 'tiktok', 'shopee']), accountIds: z.array(z.string()).max(50), scheduledAt: z.string().datetime(), caption: z.string().max(5000).optional() }),
  z.object({
    action: z.literal('update_post'),
    id: z.string(),
    update: z.object({
      caption: z.string().max(5000).optional(),
      hashtags: z.array(z.string().max(80)).max(30).optional(),
      scheduledAt: z.string().datetime().optional(),
      status: z.enum(['draft', 'approved', 'queued', 'published', 'failed']).optional(),
    }),
  }),
]);

export async function GET() {
  return NextResponse.json(getSocialDashboard(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    if (input.action === 'generate_plan') return NextResponse.json({ created: generateFourteenDayPlan(input.profileId), dashboard: getSocialDashboard() });
    if (input.action === 'refresh_intelligence') return NextResponse.json({ trends: refreshSocialIntelligence(true), dashboard: getSocialDashboard() });
    if (input.action === 'associate_media') {
      associateMediaProduct(input.mediaId, input.productLinkId);
      return NextResponse.json({ dashboard: getSocialDashboard() });
    }
    if (input.action === 'schedule_media') return NextResponse.json({ post: scheduleMedia(input), dashboard: getSocialDashboard() });
    const post = updatePost(input.id, input.update);
    return post ? NextResponse.json({ post }) : NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível atualizar a central social.' }, { status: 400 });
  }
}
