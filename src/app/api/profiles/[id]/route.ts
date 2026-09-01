import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/storage/db';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  niche: z.string().trim().min(2).max(100).optional(),
  personality: z.string().trim().min(3).max(500).optional(),
  bio: z.string().trim().min(3).max(700).optional(),
  toneOfVoice: z.string().trim().min(2).max(200).optional(),
  avatarUrl: z.string().refine((value) => value.startsWith('/api/uploads/') || /^https?:\/\//.test(value), 'Informe uma imagem válida.').optional(),
  dna: z.record(z.unknown()).optional(),
  references: z.array(z.record(z.unknown())).optional(),
  characterLock: z.record(z.boolean()).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const current = db.getProfileById(params.id);
    if (!current) return NextResponse.json({ error: 'Profile não encontrado.' }, { status: 404 });
    const update = patchSchema.parse(await request.json());
    const profile = db.saveProfile({
      ...current,
      ...update,
      dna: { ...current.dna, ...(update.dna || {}) },
      references: (update.references as typeof current.references | undefined) || current.references,
      characterLock: { ...current.characterLock, ...(update.characterLock || {}) },
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : 'Não foi possível atualizar o Profile.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const current = db.getProfileById(params.id);
  if (!current) return NextResponse.json({ error: 'Profile não encontrado.' }, { status: 404 });
  if (!db.deleteProfile(params.id)) return NextResponse.json({ error: 'Não foi possível excluir o Profile.' }, { status: 500 });
  return NextResponse.json({ deleted: true, id: params.id });
}
