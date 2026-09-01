import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Rota legada preservada para não quebrar links antigos. O OAuth atual termina no gateway HTTPS.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/redes-sociais?tiktok_error=legacy_callback_disabled', request.url));
}
