import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { PDGenerationEngine } from '@/lib/ai/engine/pd-generation-engine';
import { ImagePromptEngine } from '@/lib/ai/engine/image/image-prompt-engine';
import { ImageRouter } from '@/lib/ai/engine/image/image-router';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      profileId,
      userPrompt,
      shotType = 'portrait',
      aspectRatio = '9:16',
      realismLevel = 'ultra-realista',
      isAutoMode = false,
    } = body;

    const profile = profileId ? db.getProfileById(profileId) : undefined;
    if (!profile) {
      return NextResponse.json({ error: 'Profile não encontrado' }, { status: 404 });
    }

    if (isAutoMode) {
      // Automatic best image mode (Spec 58)
      const { imageResult } = await PDGenerationEngine.generateMasterImage(profile);
      return NextResponse.json({
        success: true,
        url: imageResult.url,
        provider: imageResult.provider,
        model: imageResult.model,
      });
    }

    const promptOutput = ImagePromptEngine.buildPrompt({
      userPrompt: userPrompt || `Foto de ${profile.name}`,
      profile,
      shotType,
      aspectRatio,
      realismLevel,
    });

    const result = await ImageRouter.generate({
      prompt: promptOutput.masterPrompt,
      negativePrompt: promptOutput.negativePrompt,
      aspectRatio,
      profileId: profile.id,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      provider: result.provider,
      model: result.model,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
