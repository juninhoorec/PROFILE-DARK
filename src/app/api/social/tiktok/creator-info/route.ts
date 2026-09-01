import { NextRequest, NextResponse } from 'next/server';
import { queryTikTokCreatorInfo } from '@/lib/social/tiktok-api';
export async function GET(request: NextRequest) { try { const accountId = request.nextUrl.searchParams.get('accountId'); if (!accountId) return NextResponse.json({ error: 'Selecione uma conta TikTok.' }, { status: 400 }); return NextResponse.json({ creator: await queryTikTokCreatorInfo(accountId) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao consultar o TikTok.' }, { status: 400 }); } }
