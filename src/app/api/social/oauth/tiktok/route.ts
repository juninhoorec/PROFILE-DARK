import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { TIKTOK_SCOPES } from '@/lib/social/tiktok-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY, redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) return NextResponse.redirect(new URL('/redes-sociais?tiktok_error=not_configured', request.url));
  const state = randomBytes(32).toString('base64url'), target = new URL('https://www.tiktok.com/v2/auth/authorize/');
  target.searchParams.set('client_key', clientKey); target.searchParams.set('redirect_uri', redirectUri); target.searchParams.set('response_type', 'code'); target.searchParams.set('scope', TIKTOK_SCOPES.join(',')); target.searchParams.set('state', state);
  const secure = redirectUri.startsWith('https://');
  if (process.env.TIKTOK_PLATFORM === 'desktop') {
    const verifier = randomBytes(64).toString('base64url').slice(0, 86), challenge = createHash('sha256').update(verifier).digest('hex');
    target.searchParams.set('code_challenge', challenge); target.searchParams.set('code_challenge_method', 'S256');
    const response = NextResponse.redirect(target); response.cookies.set('pd_tiktok_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure, maxAge: 600, path: '/' }); response.cookies.set('pd_tiktok_code_verifier', verifier, { httpOnly: true, sameSite: 'lax', secure, maxAge: 600, path: '/' }); return response;
  }
  const response = NextResponse.redirect(target); response.cookies.set('pd_tiktok_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure, maxAge: 600, path: '/' }); return response;
}
