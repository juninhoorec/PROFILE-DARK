import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const extensions = new Set(['png', 'jpg', 'webp', 'mp3', 'wav', 'm4a', 'mp4']);

export async function persistGeneratedAsset(bytes: Uint8Array, extension: string) {
  const safeExtension = extension.toLowerCase();
  if (!extensions.has(safeExtension)) throw new Error('Formato de saída não permitido.');
  if (!bytes.byteLength) throw new Error('O provider devolveu um arquivo vazio.');
  const directory = path.join(process.cwd(), 'data', 'uploads');
  await fs.mkdir(directory, { recursive: true });
  const id = `${randomUUID()}.${safeExtension}`;
  await fs.writeFile(path.join(directory, id), bytes, { flag: 'wx' });
  return { id, url: `/api/uploads/${id}` };
}
