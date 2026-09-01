import { NextResponse } from 'next/server';
import { adapterAvailability } from '@/lib/social/platform-adapters';
import { socialHealth } from '@/lib/social/cloud-store';

export const dynamic = 'force-dynamic';
export async function GET() {
  const required = { database: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], encryption: ['SOCIAL_TOKEN_ENCRYPTION_KEY'], instagram: ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI'], tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REDIRECT_URI'], worker: ['CRON_SECRET'], tenancy: ['DEFAULT_TEAM_ID'] };
  const configuration = Object.fromEntries(Object.entries(required).map(([area, keys]) => [area, { ready: keys.every((key) => Boolean(process.env[key])), missing: keys.filter((key) => !process.env[key]) }]));
  let cloud: unknown = { accounts: [], failures: [] }, databaseError: string | undefined;
  if (configuration.database.ready && configuration.tenancy.ready) try { cloud = await socialHealth(process.env.DEFAULT_TEAM_ID!); } catch (error) { databaseError = error instanceof Error ? error.message : 'Falha no banco social.'; }
  return NextResponse.json({ configuration, adapters: { instagram: adapterAvailability('instagram'), tiktok: adapterAvailability('tiktok'), shopee: adapterAvailability('shopee') }, cloud, databaseError }, { headers: { 'Cache-Control': 'no-store' } });
}
