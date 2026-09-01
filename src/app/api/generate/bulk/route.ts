import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { BulkVariationEngine, VariationKey } from '@/lib/ai/bulk-variation-engine';
import { z } from 'zod';

const schema=z.object({profileId:z.string().min(1),productId:z.string().min(1),quantity:z.number().int().min(2).max(20),format:z.enum(['reels','shorts','tiktok']),variations:z.array(z.enum(['hook','script','scenario','cta','wardrobe','framing','copy','duration'])).min(2),previewOnly:z.boolean().optional()});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const {
      profileId,
      productId,
      quantity = 5,
      variations,
      previewOnly,
    } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado.' }, { status: 400 });
    }

    const product = productId ? db.getProductById(productId) : undefined;
    if (!product) return NextResponse.json({ error:'Produto não encontrado.' }, { status:400 });
    const matrix=BulkVariationEngine.create(quantity,variations as VariationKey[]);
    if(previewOnly) return NextResponse.json({matrix,antiSpam:{passed:true,uniqueSignatures:matrix.length,total:matrix.length},estimatedCredits:quantity*80});
    return NextResponse.json({ error:'O adaptador de vídeo real ainda não foi validado. A matriz está pronta, mas nenhum job ou débito será criado.', matrix }, { status:503 });
  } catch (err: any) {
    const status=err instanceof z.ZodError?400:err.message?.includes('suficientemente diferentes')?422:500;
    return NextResponse.json({ error: err instanceof z.ZodError?err.issues[0]?.message:err.message }, { status });
  }
}
