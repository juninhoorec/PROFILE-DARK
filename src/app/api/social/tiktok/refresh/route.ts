import { NextRequest, NextResponse } from 'next/server';
import { refreshTikTokAccount } from '@/lib/social/tiktok-auth';
export async function POST(request: NextRequest) { try { const { accountId } = await request.json(); if (!accountId) return NextResponse.json({ error: 'Conta TikTok obrigatória.' }, { status: 400 }); return NextResponse.json({ account: await refreshTikTokAccount(accountId) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível renovar a conexão.' }, { status: 400 }); } }
