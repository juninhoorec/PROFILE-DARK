import fs from 'node:fs/promises';
import path from 'node:path';
import { runProcess } from '../../../local-media';

const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

export interface SceneContinuityState {
  sceneNumber: number;
  characterPose: string;
  wardrobe: string;
  lighting: string;
  environment: string;
  productPlacement: string;
  lastFramePath?: string;
  cameraEndingVector?: string;
}

export class ContinuityEngine {
  /**
   * Extracts the exact last frame of a video clip to feed into the next scene.
   */
  static async extractLastFrame(videoPath: string, outputImagePath: string): Promise<string> {
    await fs.mkdir(path.dirname(outputImagePath), { recursive: true });
    // Extract last frame within the last 0.08s
    await runProcess(
      ffmpeg,
      ['-y', '-sseof', '-0.08', '-i', videoPath, '-frames:v', '1', '-q:v', '2', outputImagePath],
      60_000
    );
    return outputImagePath;
  }

  /**
   * Generates continuity instructions for scene N+1 based on scene N state.
   */
  static buildSceneContinuityPrompt(
    previousState: SceneContinuityState | null,
    nextSceneAction: string
  ): string {
    if (!previousState) {
      return nextSceneAction;
    }

    const directives = [
      nextSceneAction,
      `[CONTINUITY LOCK]: Maintain identical character facial structure, hair styling, wardrobe (${previousState.wardrobe}), environmental background (${previousState.environment}), and studio lighting (${previousState.lighting}). Seamless cut without jarring jumps.`,
    ];

    return directives.join('\n');
  }
}
