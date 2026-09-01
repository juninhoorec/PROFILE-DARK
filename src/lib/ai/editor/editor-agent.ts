import fs from 'node:fs/promises';
import path from 'node:path';
import { FFmpegRenderEngine } from '../engine/render/ffmpeg-render-engine';
import { runProcess } from '../../local-media';

const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

export interface EditCutInstruction {
  sceneNumber: number;
  inputVideoPath: string;
  startTimeSeconds?: number;
  endTimeSeconds?: number;
  trimReason?: string;
  isBroll?: boolean;
}

export interface EditorAssemblyResult {
  finalVideoPath: string;
  finalVideoUrl?: string;
  totalDurationSeconds: number;
  operationalDecisions: string[];
  cutsApplied: number;
}

export class EditorAgent {
  /**
   * Applies Smart Cuts to a single scene video before artifacts occur.
   */
  static async applySmartCut(
    inputVideoPath: string,
    outputPath: string,
    startTime = 0,
    endTime?: number
  ): Promise<string> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const args = ['-y', '-ss', startTime.toFixed(2), '-i', inputVideoPath];
    if (endTime && endTime > startTime) {
      args.push('-to', (endTime - startTime).toFixed(2));
    }
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', outputPath);

    await runProcess(ffmpeg, args, 30_000);
    return outputPath;
  }

  /**
   * Assembles, trims, and normalizes a sequence of scene video cuts into the final polished video.
   */
  static async assembleProject(params: {
    projectTitle: string;
    cuts: EditCutInstruction[];
    outputFinalPath?: string;
    targetResolution?: '720p' | '1080p';
    targetFps?: number;
    minDurationSeconds?: number;
  }): Promise<EditorAssemblyResult> {
    const { cuts, outputFinalPath, targetResolution = '1080p', targetFps = 30, minDurationSeconds = 15 } = params;

    const operationalDecisions: string[] = [];
    const processedScenePaths: string[] = [];
    const workDir = path.join(
      process.cwd(),
      'data',
      'editor-assembly',
      `edit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    );
    await fs.mkdir(workDir, { recursive: true });

    for (let i = 0; i < cuts.length; i++) {
      const cut = cuts[i];
      let scenePath = cut.inputVideoPath;

      if (cut.endTimeSeconds && cut.endTimeSeconds > 0) {
        const trimmedPath = path.join(workDir, `scene_${cut.sceneNumber}_trimmed.mp4`);
        await this.applySmartCut(cut.inputVideoPath, trimmedPath, cut.startTimeSeconds || 0, cut.endTimeSeconds);
        scenePath = trimmedPath;
        operationalDecisions.push(
          `Cena ${cut.sceneNumber} ajustada para corte em ${cut.endTimeSeconds.toFixed(2)}s (${cut.trimReason || 'Smart Cut'}).`
        );
      } else {
        operationalDecisions.push(`Cena ${cut.sceneNumber} mantida integralmente.`);
      }

      processedScenePaths.push(scenePath);
    }

    // Call FFmpeg Render Engine with Loudness Normalization & AAC 48kHz
    const renderRes = await FFmpegRenderEngine.renderFinalVideo({
      sceneVideoPaths: processedScenePaths,
      targetResolution,
      targetFps,
      minDurationSeconds,
    });

    let finalDest = renderRes.videoPath;
    if (outputFinalPath) {
      await fs.mkdir(path.dirname(outputFinalPath), { recursive: true });
      await fs.copyFile(renderRes.videoPath, outputFinalPath);
      finalDest = outputFinalPath;
    }

    return {
      finalVideoPath: finalDest,
      totalDurationSeconds: renderRes.durationSeconds,
      operationalDecisions,
      cutsApplied: cuts.filter((c) => Boolean(c.endTimeSeconds)).length,
    };
  }
}
