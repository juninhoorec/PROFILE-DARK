import type { NextApiRequest, NextApiResponse } from 'next';
import { decryptTicket, encryptTicket } from '../../../lib/ticket';

type RefreshRequest = { type: string; refresh_token: string; iat: number; exp: number };

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'method_not_allowed' });
  try {
    const input = decryptTicket<RefreshRequest>(String(request.body?.ticket || ''));
    if (input.type !== 'refresh_request' || !input.refresh_token) throw new Error('invalid_ticket');
    const clientKey = process.env.TIKTOK_CLIENT_KEY, clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) return response.status(503).json({ error: 'not_configured' });
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: input.refresh_token }) });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token) return response.status(401).json({ error: 'refresh_failed' });
    return response.status(200).json({ ticket: encryptTicket({ type: 'refresh_response', ...token }) });
  } catch {
    return response.status(400).json({ error: 'invalid_or_expired_ticket' });
  }
}
