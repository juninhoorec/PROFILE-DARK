import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY, redirect = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirect) return NextResponse.redirect(new URL('/redes-sociais?activation=tiktok', request.url));
  const state = randomBytes(24).toString('base64url'), target = new URL('https://www.tiktok.com/v2/auth/authorize/');
  target.searchParams.set('client_key', clientKey); target.searchParams.set('redirect_uri', redirect); target.searchParams.set('response_type', 'code'); target.searchParams.set('scope', 'user.info.basic,video.publish'); target.searchParams.set('state', state);
  const response = NextResponse.redirect(target); response.cookies.set('pd_tiktok_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', maxAge: 600, path: '/' }); return response;
}
