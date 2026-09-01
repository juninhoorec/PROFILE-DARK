import { NextResponse } from 'next/server';
import { listTikTokAccounts } from '@/lib/social/tiktok-auth';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ accounts: listTikTokAccounts() }, { headers: { 'Cache-Control': 'no-store' } }); }
