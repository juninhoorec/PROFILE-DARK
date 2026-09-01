import { NextResponse } from 'next/server';
import { saveSocialAccount } from '@/lib/social/cloud-store';

export async function GET(request: Request) {
  const url = new URL(request.url), code = url.searchParams.get('code'), state = url.searchParams.get('state');
  const cookie = request.headers.get('cookie')?.match(/pd_meta_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || state !== cookie) return NextResponse.json({ error: 'Estado OAuth inválido.' }, { status: 400 });
  const tokenUrl = new URL('https://graph.facebook.com/v23.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', process.env.META_APP_ID || ''); tokenUrl.searchParams.set('client_secret', process.env.META_APP_SECRET || ''); tokenUrl.searchParams.set('redirect_uri', process.env.META_REDIRECT_URI || ''); tokenUrl.searchParams.set('code', code);
  const tokenResponse = await fetch(tokenUrl); const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return NextResponse.json({ error: token.error?.message || 'Falha no token Meta.' }, { status: 400 });
  const pagesResponse = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(token.access_token)}`); const pages = await pagesResponse.json();
  if (!pagesResponse.ok) return NextResponse.json({ error: pages.error?.message || 'Falha ao listar contas Meta.' }, { status: 400 });
  const teamId = process.env.DEFAULT_TEAM_ID; if (!teamId) return NextResponse.json({ error: 'Configure DEFAULT_TEAM_ID.' }, { status: 503 });
  for (const page of pages.data || []) if (page.instagram_business_account) await saveSocialAccount({ teamId, platform: 'instagram', platformAccountId: page.instagram_business_account.id, displayName: page.instagram_business_account.name || page.name, handle: page.instagram_business_account.username, accessToken: page.access_token });
  return NextResponse.redirect(new URL('/redes-sociais?connected=instagram', request.url));
}
