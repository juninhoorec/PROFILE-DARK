import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const gateway = process.env.TIKTOK_GATEWAY_URL;
  if (!gateway) return NextResponse.redirect(new URL('/redes-sociais?tiktok_error=gateway_not_configured', request.url));
  try { return NextResponse.redirect(new URL('/api/tiktok/auth', gateway)); }
  catch { return NextResponse.redirect(new URL('/redes-sociais?tiktok_error=invalid_gateway_url', request.url)); }
}
