import { NextRequest, NextResponse } from 'next/server';
import { saveTikTokAccount, TIKTOK_SCOPES, type TikTokTokenResponse } from '@/lib/social/tiktok-auth';
import { decryptTikTokTicket } from '@/lib/social/tiktok-handoff';

export const runtime = 'nodejs';
type Handoff = TikTokTokenResponse & { type: string; display_name?: string; avatar_url?: string; iat: number; exp: number };
const finish = (request: NextRequest, value: string) => NextResponse.redirect(new URL(`/redes-sociais?${value}`, request.url));

export async function GET(request: NextRequest) {
  const gatewayError = request.nextUrl.searchParams.get('error');
  if (gatewayError) return finish(request, `tiktok_error=${encodeURIComponent(gatewayError)}`);
  const ticket = request.nextUrl.searchParams.get('ticket');
  if (!ticket) return finish(request, 'tiktok_error=missing_ticket');
  try {
    const payload = decryptTikTokTicket<Handoff>(ticket);
    if (payload.type !== 'oauth_handoff' || !payload.access_token || !payload.refresh_token || !payload.open_id) throw new Error('invalid_ticket');
    const granted = new Set(payload.scope.split(',').map((item) => item.trim()));
    if (TIKTOK_SCOPES.some((scope) => !granted.has(scope))) throw new Error('missing_required_scope');
    saveTikTokAccount(payload, { displayName: payload.display_name || `TikTok ${payload.open_id.slice(-6)}`, avatarUrl: payload.avatar_url });
    return finish(request, 'tiktok=connected');
  } catch {
    return finish(request, 'tiktok_error=invalid_or_expired_ticket');
  }
}
