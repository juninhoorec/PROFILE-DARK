import fs from 'node:fs/promises';
import path from 'node:path';
import { runProcess } from '../../local-media';

const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

export interface ContinuityState {
  faceState: string;
  hairState: string;
  wardrobeState: string;
  productState?: string;
  environmentState: string;
  lightingState: string;
  cameraState: string;
  objectPositions?: Record<string, string>;
}

export interface SceneContinuityPackage {
  sceneNumber: number;
  lastApprovedVideoPath: string;
  sceneEndReferencePath: string;
  continuityState: ContinuityState;
  nextSceneTransitionType: 'CONTINUOUS' | 'EDITORIAL_CUT' | 'CLOSEUP_CUT';
}

export class ContinuityEngineV2 {
  /**
   * Extracts the last approved frame of a scene and saves it as scene-end-reference.png.
   */
  static async extractSceneEndReference(videoPath: string, outputDir: string): Promise<string> {
    await fs.mkdir(outputDir, { recursive: true });
    const endRefPath = path.join(outputDir, 'scene-end-reference.png');

    await runProcess(
      ffmpeg,
      ['-y', '-sseof', '-0.1', '-i', videoPath, '-vframes', '1', '-q:v', '2', endRefPath],
      20_000
    );

    return endRefPath;
  }

  /**
   * Builds the Continuity State for the scene and determines transition logic.
   */
  static buildContinuityPackage(params: {
    sceneNumber: number;
    videoPath: string;
    sceneEndRefPath: string;
    currentShotType: 'talking_head' | 'product_demo' | 'b_roll';
    nextShotType: 'talking_head' | 'product_demo' | 'b_roll' | 'cta';
    profileName: string;
    productName?: string;
  }): SceneContinuityPackage {
    const {
      sceneNumber,
      videoPath,
      sceneEndRefPath,
      currentShotType,
      nextShotType,
      profileName,
      productName,
    } = params;

    // Detect cut-aware editorial transition (Spec 11)
    let nextSceneTransitionType: 'CONTINUOUS' | 'EDITORIAL_CUT' | 'CLOSEUP_CUT' = 'CONTINUOUS';
    if (currentShotType === 'talking_head' && nextShotType === 'product_demo') {
      nextSceneTransitionType = 'CLOSEUP_CUT';
    } else if (currentShotType !== nextShotType) {
      nextSceneTransitionType = 'EDITORIAL_CUT';
    }

    const continuityState: ContinuityState = {
      faceState: `Expressão amigável e calorosa de ${profileName}`,
      hairState: 'Cabelo arrumado natural com luz de contorno',
      wardrobeState: 'Vestimenta acolhedora e consistente em tom quente',
      productState: productName ? `Embalagem nítida de ${productName}` : undefined,
      environmentState: 'Cozinha doméstica brasileira iluminada por luz natural suave',
      lightingState: 'Iluminação difusa 5600K sem sombras duras',
      cameraState: nextSceneTransitionType === 'CLOSEUP_CUT' ? 'Corte suave para plano detalhe' : 'Plano médio vertical 9:16',
      objectPositions: productName ? { [productName]: 'Bancada principal' } : undefined,
    };

    return {
      sceneNumber,
      lastApprovedVideoPath: videoPath,
      sceneEndReferencePath: sceneEndRefPath,
      continuityState,
      nextSceneTransitionType,
    };
  }
}
