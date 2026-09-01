import { NextResponse } from 'next/server';
import { saveSocialAccount } from '@/lib/social/cloud-store';

export async function GET(request: Request) {
  const url = new URL(request.url), code = url.searchParams.get('code'), state = url.searchParams.get('state');
  const cookie = request.headers.get('cookie')?.match(/pd_tiktok_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || state !== cookie) return NextResponse.json({ error: 'Estado OAuth inválido.' }, { status: 400 });
  const body = new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY || '', client_secret: process.env.TIKTOK_CLIENT_SECRET || '', code, grant_type: 'authorization_code', redirect_uri: process.env.TIKTOK_REDIRECT_URI || '' });
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }); const token = await response.json();
  if (!response.ok || !token.access_token) return NextResponse.json({ error: token.error_description || 'Falha no token TikTok.' }, { status: 400 });
  const teamId = process.env.DEFAULT_TEAM_ID; if (!teamId) return NextResponse.json({ error: 'Configure DEFAULT_TEAM_ID.' }, { status: 503 });
  await saveSocialAccount({ teamId, platform: 'tiktok', platformAccountId: token.open_id, displayName: `TikTok ${token.open_id.slice(-6)}`, accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString() });
  return NextResponse.redirect(new URL('/redes-sociais?connected=tiktok', request.url));
}
