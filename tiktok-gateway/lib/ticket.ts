import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const key = () => {
  const secret = process.env.TIKTOK_HANDOFF_SECRET;
  if (!secret || secret.length < 32) throw new Error('TIKTOK_HANDOFF_SECRET deve ter ao menos 32 caracteres.');
  return createHash('sha256').update(secret, 'utf8').digest();
};

export function encryptTicket(data: Record<string, unknown>, lifetimeSeconds = 90) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ ...data, iat: now, exp: now + lifetimeSeconds }), 'utf8');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptTicket<T extends { iat: number; exp: number }>(ticket: string): T {
  const [version, ivText, tagText, ciphertextText] = ticket.split('.');
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText) throw new Error('Ticket inválido.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  const value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertextText, 'base64url')), decipher.final()]).toString('utf8')) as T;
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(value.iat) || !Number.isFinite(value.exp) || value.exp <= now || value.exp - value.iat > 120 || value.iat > now + 10) throw new Error('Ticket expirado ou inválido.');
  return value;
}
