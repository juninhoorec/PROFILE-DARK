import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { AgentEditor } from '@/lib/ai/editor/agent-editor';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, productId, promptText, durationSeconds = 3, sceneTitle } = body;

    const profile = profileId ? db.getProfileById(profileId) : db.getProfiles()[0];
    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado' }, { status: 404 });
    }

    const product = productId ? db.getProductById(productId) : undefined;

    const result = await AgentEditor.produceSceneWithMultiTake({
      profile,
      product,
      promptText,
      durationSeconds,
      sceneTitle,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
