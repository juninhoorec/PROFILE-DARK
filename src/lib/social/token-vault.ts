import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const key = () => {
  const secret = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY precisa ter pelo menos 32 caracteres.');
  return createHash('sha256').update(secret).digest();
};

export function encryptToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((item) => item.toString('base64url')).join('.');
}

export function decryptToken(value: string) {
  const [iv, tag, encrypted] = value.split('.').map((item) => Buffer.from(item, 'base64url'));
  if (!iv || !tag || !encrypted) throw new Error('Token criptografado inválido.');
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
