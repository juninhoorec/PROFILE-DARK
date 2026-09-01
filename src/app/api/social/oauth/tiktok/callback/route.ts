import { NextRequest, NextResponse } from 'next/server';
import { exchangeTikTokCode, saveTikTokAccount, TIKTOK_SCOPES } from '@/lib/social/tiktok-auth';

export const runtime = 'nodejs';
const redirectError = (request: NextRequest, code: string) => NextResponse.redirect(new URL(`/redes-sociais?tiktok_error=${encodeURIComponent(code)}`, request.url));

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error'), code = request.nextUrl.searchParams.get('code'), state = request.nextUrl.searchParams.get('state');
  if (error) return redirectError(request, error === 'access_denied' ? 'access_denied' : 'authorization_failed');
  if (!code) return redirectError(request, 'missing_code');
  const expectedState = request.cookies.get('pd_tiktok_oauth_state')?.value;
  if (!state || !expectedState || state !== expectedState) return redirectError(request, 'invalid_state');
  const redirectUri = process.env.TIKTOK_REDIRECT_URI; if (!redirectUri) return redirectError(request, 'not_configured');
  try {
    const codeVerifier = process.env.TIKTOK_PLATFORM === 'desktop' ? request.cookies.get('pd_tiktok_code_verifier')?.value : undefined;
    if (process.env.TIKTOK_PLATFORM === 'desktop' && !codeVerifier) return redirectError(request, 'missing_code_verifier');
    const token = await exchangeTikTokCode(code, redirectUri, codeVerifier);
    const granted = new Set(token.scope.split(',').map((item) => item.trim()));
    if (TIKTOK_SCOPES.some((scope) => !granted.has(scope))) return redirectError(request, 'missing_required_scope');
    const profileResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name', { headers: { Authorization: `Bearer ${token.access_token}` } });
    const profileResult = await profileResponse.json();
    if (!profileResponse.ok || profileResult.error?.code !== 'ok') throw new Error(profileResult.error?.message || 'Não foi possível identificar a conta TikTok.');
    saveTikTokAccount(token, { displayName: profileResult.data?.user?.display_name || `TikTok ${token.open_id.slice(-6)}`, avatarUrl: profileResult.data?.user?.avatar_url });
    const response = NextResponse.redirect(new URL('/redes-sociais?tiktok_connected=1', request.url)); response.cookies.delete('pd_tiktok_oauth_state'); response.cookies.delete('pd_tiktok_code_verifier'); return response;
  } catch (exchangeError) {
    console.error('TikTok OAuth callback failed:', exchangeError instanceof Error ? exchangeError.message : exchangeError);
    return redirectError(request, 'token_exchange_failed');
  }
}
