import { timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { encryptTicket } from '../../../lib/ticket';

const localResult = (response: NextApiResponse, params: Record<string, string>) => {
  const target = new URL('http://localhost:3000/api/social/oauth/tiktok/handoff');
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value));
  response.setHeader('Set-Cookie', 'pd_tiktok_gateway_state=; Path=/api/tiktok/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  response.redirect(307, target.toString());
};

const cookieValue = (request: NextApiRequest, name: string) => request.cookies[name];
const sameState = (received?: string, expected?: string) => {
  if (!received || !expected) return false;
  const a = Buffer.from(received), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const error = typeof request.query.error === 'string' ? request.query.error : undefined;
  if (error) return localResult(response, { error: error === 'access_denied' ? 'access_denied' : 'authorization_failed' });
  const code = typeof request.query.code === 'string' ? request.query.code : undefined;
  const state = typeof request.query.state === 'string' ? request.query.state : undefined;
  if (!code) return localResult(response, { error: 'missing_code' });
  if (!sameState(state, cookieValue(request, 'pd_tiktok_gateway_state'))) return localResult(response, { error: 'invalid_state' });
  const clientKey = process.env.TIKTOK_CLIENT_KEY, clientSecret = process.env.TIKTOK_CLIENT_SECRET, redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !clientSecret || !redirectUri) return localResult(response, { error: 'not_configured' });
  try {
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token) throw new Error('token_exchange_failed');
    const granted = new Set(String(token.scope || '').split(',').map((item) => item.trim()));
    if (!granted.has('user.info.basic') || !granted.has('video.publish')) throw new Error('missing_required_scope');
    const profileResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name', { headers: { Authorization: `Bearer ${token.access_token}` } });
    const profileResult = await profileResponse.json();
    if (!profileResponse.ok || profileResult.error?.code !== 'ok') throw new Error('profile_lookup_failed');
    const ticket = encryptTicket({ type: 'oauth_handoff', access_token: token.access_token, refresh_token: token.refresh_token, expires_in: token.expires_in, refresh_expires_in: token.refresh_expires_in, open_id: token.open_id, scope: token.scope, token_type: token.token_type, display_name: profileResult.data?.user?.display_name, avatar_url: profileResult.data?.user?.avatar_url });
    return localResult(response, { ticket });
  } catch (errorValue) {
    const codeValue = errorValue instanceof Error ? errorValue.message : 'token_exchange_failed';
    return localResult(response, { error: ['missing_required_scope', 'profile_lookup_failed'].includes(codeValue) ? codeValue : 'token_exchange_failed' });
  }
}
