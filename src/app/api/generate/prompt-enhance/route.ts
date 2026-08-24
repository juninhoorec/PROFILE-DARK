import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { PromptEnhancer } from '@/lib/ai/prompt-enhancer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, profileId, productId, objective, realismLevel } = body;

    const profile = profileId ? db.getProfileById(profileId) : undefined;
    const product = productId ? db.getProductById(productId) : undefined;

    const result = PromptEnhancer.enhance({
      rawPrompt: prompt || '',
      profile,
      product,
      objective,
      realismLevel,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
