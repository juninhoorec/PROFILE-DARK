import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const appId = process.env.META_APP_ID, redirect = process.env.META_REDIRECT_URI;
  if (!appId || !redirect) return NextResponse.redirect(new URL('/redes-sociais?activation=instagram', request.url));
  const state = randomBytes(24).toString('base64url');
  const target = new URL('https://www.facebook.com/v23.0/dialog/oauth');
  target.searchParams.set('client_id', appId); target.searchParams.set('redirect_uri', redirect); target.searchParams.set('state', state); target.searchParams.set('scope', 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement');
  const response = NextResponse.redirect(target);
  response.cookies.set('pd_meta_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', maxAge: 600, path: '/' });
  return response;
}
