import { encryptToken } from './token-vault';

const config = () => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Banco social não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  return { url, key };
};

async function request(table: string, init: RequestInit, query = '') {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${table}${query}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates', ...init.headers } });
  const body = await response.text();
  if (!response.ok) throw new Error(`Banco social: ${body || response.status}`);
  return body ? JSON.parse(body) : [];
}

export async function saveSocialAccount(input: { teamId: string; profileId?: string; platform: string; platformAccountId: string; displayName: string; handle?: string; accessToken: string; refreshToken?: string; expiresAt?: string }) {
  const [account] = await request('social_accounts', { method: 'POST', body: JSON.stringify({ team_id: input.teamId, profile_id: input.profileId, platform: input.platform, platform_account_id: input.platformAccountId, display_name: input.displayName, handle: input.handle, access_token_ciphertext: encryptToken(input.accessToken), refresh_token_ciphertext: input.refreshToken ? encryptToken(input.refreshToken) : null, token_expires_at: input.expiresAt, status: 'connected' }) }, '?on_conflict=team_id,platform,platform_account_id');
  return account;
}

export async function socialHealth(teamId: string) {
  const accounts = await request('social_accounts', { method: 'GET' }, `?team_id=eq.${encodeURIComponent(teamId)}&select=id,platform,display_name,handle,status,token_expires_at,created_at`);
  const failures = await request('social_posts', { method: 'GET' }, `?team_id=eq.${encodeURIComponent(teamId)}&status=eq.failed&select=id,platform,last_error,attempts&order=created_at.desc&limit=20`);
  return { accounts, failures };
}
