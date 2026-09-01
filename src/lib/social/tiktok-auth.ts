import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { decryptToken, encryptToken } from './token-vault';

const STORE_FILE = path.join(process.cwd(), 'data', 'tiktok-accounts.json');
export const TIKTOK_SCOPES = ['user.info.basic', 'video.publish'] as const;

export type TikTokTokenResponse = {
  access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number;
  open_id: string; scope: string; token_type: string;
};

type StoredTikTokAccount = {
  id: string; openId: string; displayName: string; avatarUrl?: string; username?: string;
  accessTokenCiphertext: string; refreshTokenCiphertext: string;
  accessTokenExpiresAt: string; refreshTokenExpiresAt: string; scope: string[];
  status: 'connected' | 'expired' | 'revoked'; connectedAt: string; updatedAt: string;
};

export type PublicTikTokAccount = Pick<StoredTikTokAccount, 'id'|'openId'|'displayName'|'avatarUrl'|'username'|'accessTokenExpiresAt'|'refreshTokenExpiresAt'|'scope'|'status'|'connectedAt'|'updatedAt'>;

const load = (): StoredTikTokAccount[] => { try { const value = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); return Array.isArray(value) ? value : []; } catch { return []; } };
const save = (accounts: StoredTikTokAccount[]) => { fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true }); const temp = `${STORE_FILE}.${process.pid}.tmp`; fs.writeFileSync(temp, JSON.stringify(accounts, null, 2), { encoding: 'utf8', mode: 0o600 }); fs.renameSync(temp, STORE_FILE); };
const publicAccount = ({ accessTokenCiphertext: _a, refreshTokenCiphertext: _r, ...account }: StoredTikTokAccount): PublicTikTokAccount => account;

export function listTikTokAccounts() { return load().map(publicAccount); }

export function saveTikTokAccount(token: TikTokTokenResponse, profile: { displayName: string; avatarUrl?: string; username?: string }) {
  const accounts = load(), now = new Date(), existing = accounts.find((item) => item.openId === token.open_id);
  const account: StoredTikTokAccount = {
    id: existing?.id || `tiktok_${randomUUID()}`, openId: token.open_id,
    displayName: profile.displayName || existing?.displayName || 'Conta TikTok', avatarUrl: profile.avatarUrl, username: profile.username,
    accessTokenCiphertext: encryptToken(token.access_token), refreshTokenCiphertext: encryptToken(token.refresh_token),
    accessTokenExpiresAt: new Date(now.getTime() + token.expires_in * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(now.getTime() + token.refresh_expires_in * 1000).toISOString(),
    scope: token.scope.split(',').map((item) => item.trim()).filter(Boolean), status: 'connected',
    connectedAt: existing?.connectedAt || now.toISOString(), updatedAt: now.toISOString(),
  };
  const index = accounts.findIndex((item) => item.openId === token.open_id); if (index >= 0) accounts[index] = account; else accounts.push(account); save(accounts); return publicAccount(account);
}

function getStoredAccount(id: string) { const account = load().find((item) => item.id === id); if (!account) throw new Error('Conta TikTok não encontrada.'); return account; }

async function tokenRequest(body: URLSearchParams): Promise<TikTokTokenResponse> {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body });
  const result = await response.json(); if (!response.ok || !result.access_token) throw new Error(result.error_description || result.message || 'O TikTok recusou a atualização do token.'); return result;
}

export async function exchangeTikTokCode(code: string, redirectUri: string, codeVerifier?: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY, clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) throw new Error('A integração TikTok ainda não foi configurada pelo administrador.');
  const body = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }); if (codeVerifier) body.set('code_verifier', codeVerifier);
  return tokenRequest(body);
}

export async function refreshTikTokAccount(id: string) {
  const account = getStoredAccount(id), clientKey = process.env.TIKTOK_CLIENT_KEY, clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) throw new Error('Credenciais TikTok ausentes no servidor.');
  if (Date.parse(account.refreshTokenExpiresAt) <= Date.now()) { account.status = 'expired'; save(load().map((item) => item.id === id ? account : item)); throw new Error('A autorização TikTok expirou. Conecte a conta novamente.'); }
  try {
    const token = await tokenRequest(new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: decryptToken(account.refreshTokenCiphertext) }));
    return saveTikTokAccount(token, { displayName: account.displayName, avatarUrl: account.avatarUrl, username: account.username });
  } catch (error) {
    account.status = 'expired'; account.updatedAt = new Date().toISOString(); save(load().map((item) => item.id === id ? account : item)); throw new Error(error instanceof Error ? error.message : 'Refresh token TikTok inválido.');
  }
}

export async function getValidTikTokAccessToken(id: string) {
  let account = getStoredAccount(id); if (account.status !== 'connected') throw new Error('Conta TikTok desconectada.');
  if (Date.parse(account.accessTokenExpiresAt) <= Date.now() + 5 * 60_000) { await refreshTikTokAccount(id); account = getStoredAccount(id); }
  return { accessToken: decryptToken(account.accessTokenCiphertext), account: publicAccount(account) };
}
