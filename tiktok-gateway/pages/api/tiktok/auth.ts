import { randomBytes } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_request: NextApiRequest, response: NextApiResponse) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) return response.status(503).json({ error: 'TikTok gateway não configurado.' });
  const state = randomBytes(32).toString('base64url');
  const authorize = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authorize.searchParams.set('client_key', clientKey);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', 'user.info.basic,video.publish');
  authorize.searchParams.set('state', state);
  response.setHeader('Set-Cookie', `pd_tiktok_gateway_state=${state}; Path=/api/tiktok/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  response.redirect(307, authorize.toString());
}
