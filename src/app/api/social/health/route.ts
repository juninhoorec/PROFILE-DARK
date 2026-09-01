import { NextResponse } from 'next/server';
import { adapterAvailability } from '@/lib/social/platform-adapters';
import { socialHealth } from '@/lib/social/cloud-store';
import { listTikTokAccounts } from '@/lib/social/tiktok-auth';

export const dynamic = 'force-dynamic';
export async function GET() {
  const required = { database: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], encryption: ['SOCIAL_TOKEN_ENCRYPTION_KEY'], instagram: ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI'], tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REDIRECT_URI'], worker: ['CRON_SECRET'], tenancy: ['DEFAULT_TEAM_ID'] };
  const configuration = Object.fromEntries(Object.entries(required).map(([area, keys]) => [area, { ready: keys.every((key) => Boolean(process.env[key])), missing: keys.filter((key) => !process.env[key]) }]));
  let cloud: { accounts: unknown[]; failures: unknown[] } = { accounts: listTikTokAccounts().map((account) => ({ id: account.id, platform: 'tiktok', display_name: account.displayName, handle: account.username, avatar_url: account.avatarUrl, status: account.status, token_expires_at: account.accessTokenExpiresAt })), failures: [] }, databaseError: string | undefined;
  if (configuration.database.ready && configuration.tenancy.ready) try { const remote = await socialHealth(process.env.DEFAULT_TEAM_ID!); cloud = { accounts: [...cloud.accounts, ...remote.accounts.filter((account: { platform: string }) => account.platform !== 'tiktok')], failures: remote.failures }; } catch (error) { databaseError = error instanceof Error ? error.message : 'Falha no banco social.'; }
  return NextResponse.json({ configuration, adapters: { instagram: adapterAvailability('instagram'), tiktok: adapterAvailability('tiktok'), shopee: adapterAvailability('shopee') }, cloud, databaseError }, { headers: { 'Cache-Control': 'no-store' } });
}
