import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createTikTokJob, updateTikTokJob } from '@/lib/social/tiktok-jobs';
import { directPostTikTok } from '@/lib/social/tiktok-api';

export const runtime = 'nodejs';
const schema = z.object({ accountId: z.string().min(1), mediaId: z.string().min(1), title: z.string().max(2200).default(''), privacyLevel: z.enum(['PUBLIC_TO_EVERYONE','FOLLOWER_OF_CREATOR','MUTUAL_FOLLOW_FRIENDS','SELF_ONLY']), disableComment: z.boolean(), disableDuet: z.boolean(), disableStitch: z.boolean(), videoCoverTimestampMs: z.number().int().min(0).optional() });
export async function POST(request: NextRequest) {
  let jobId: string | undefined;
  try {
    const input = schema.parse(await request.json()), job = createTikTokJob(input.accountId, input.mediaId); jobId = job.id;
    const result = await directPostTikTok(input.accountId, input.mediaId, input, (status) => updateTikTokJob(job.id, { status }));
    return NextResponse.json({ job: updateTikTokJob(job.id, { publishId: result.publishId, status: 'processing' }), creator: result.creator });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'A publicação não foi iniciada.'; if (jobId) updateTikTokJob(jobId, { status: 'error', error: message }); return NextResponse.json({ error: message, jobId }, { status: 400 });
  }
}
