import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { runProcess } from '../../../local-media';
import { GenerativeMotionScore } from '../interfaces';

const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

export class GenerativeVideoValidator {
  /**
   * Extracts 5 keyframes (0%, 25%, 50%, 75%, 100%) from a video file.
   */
  static async extractKeyframes(videoPath: string, outputDir: string, durationSeconds = 3): Promise<string[]> {
    await fs.mkdir(outputDir, { recursive: true });
    const timestamps = [0.1, durationSeconds * 0.25, durationSeconds * 0.5, durationSeconds * 0.75, Math.max(0.2, durationSeconds - 0.1)];
    const framePaths: string[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const frameFile = path.join(outputDir, `frame_${i}_${Math.round(ts * 100)}ms.jpg`);
      await runProcess(
        ffmpeg,
        ['-y', '-ss', ts.toFixed(2), '-i', videoPath, '-vframes', '1', '-q:v', '2', frameFile],
        30_000
      );
      framePaths.push(frameFile);
    }

    return framePaths;
  }

  /**
   * Analyzes video motion characteristics to distinguish Generative Diffusion from 2D Zoom/Pan/Warp.
   */
  static async validateVideo(videoPath: string, durationSeconds = 3): Promise<GenerativeMotionScore> {
    const tempDir = path.join(process.cwd(), 'data', 'validation-temp', `val_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

    try {
      const framePaths = await this.extractKeyframes(videoPath, tempDir, durationSeconds);
      if (framePaths.length < 2) {
        return {
          isGenerativeMotion: false,
          overallMotionScore: 0,
          temporalVariance: 0,
          affineUniformity: 1.0,
          opticalFlowScore: 0,
          detectedMotionType: 'STATIC_ZOOM_PAN',
          validationMessage: 'Não foi possível extrair frames suficientes para validação.',
        };
      }

      // Read raw grayscale pixels for fast optical / differential analysis
      const frameBuffers = await Promise.all(
        framePaths.map((f) => sharp(f).resize(128, 128, { fit: 'fill' }).grayscale().raw().toBuffer())
      );

      // Compute frame-to-frame pixel differences
      let totalDiff = 0;
      let quadrantVariances: number[] = [0, 0, 0, 0]; // 4 spatial quadrants

      for (let i = 0; i < frameBuffers.length - 1; i++) {
        const bufA = frameBuffers[i];
        const bufB = frameBuffers[i + 1];

        for (let y = 0; y < 128; y++) {
          for (let x = 0; x < 128; x++) {
            const idx = y * 128 + x;
            const diff = Math.abs(bufA[idx] - bufB[idx]);
            totalDiff += diff;

            const qIdx = (y < 64 ? 0 : 2) + (x < 64 ? 0 : 1);
            quadrantVariances[qIdx] += diff;
          }
        }
      }

      const pixelCount = 128 * 128 * (frameBuffers.length - 1);
      const avgPixelDelta = totalDiff / pixelCount; // 0 to 255
      const temporalVariance = Math.min(100, Math.round((avgPixelDelta / 30) * 100));

      // Check Spatial Quadrant Uniformity
      // In pure uniform zoom/pan, all quadrants receive almost identical proportional shifts.
      // In generative motion (e.g. face/hands moving while background is stable), variance is non-uniform.
      const qSum = quadrantVariances.reduce((a, b) => a + b, 0);
      let affineUniformity = 1.0;
      if (qSum > 0) {
        const qProps = quadrantVariances.map((q) => q / qSum);
        const dev = qProps.reduce((sum, p) => sum + Math.abs(p - 0.25), 0);
        affineUniformity = Math.max(0, Math.min(1, 1 - dev * 1.5));
      }

      const opticalFlowScore = Math.min(100, Math.round(temporalVariance * (1.2 - affineUniformity * 0.4)));

      let detectedMotionType: 'GENERATIVE_3D_DIFFUSION' | 'TALKING_AVATAR_2D' | 'STATIC_ZOOM_PAN';
      let isGenerativeMotion = false;

      if (temporalVariance < 5) {
        detectedMotionType = 'STATIC_ZOOM_PAN';
        isGenerativeMotion = false;
      } else if (temporalVariance >= 15 && affineUniformity < 0.7) {
        detectedMotionType = 'GENERATIVE_3D_DIFFUSION';
        isGenerativeMotion = true;
      } else {
        detectedMotionType = 'TALKING_AVATAR_2D';
        isGenerativeMotion = false;
      }

      const overallMotionScore = Math.min(100, Math.max(10, Math.round(opticalFlowScore * 0.7 + (1 - affineUniformity) * 30)));

      let validationMessage = '';
      if (isGenerativeMotion) {
        validationMessage = `✓ Movimento generativo 3D validado (Variância temporal: ${temporalVariance}%, Não-uniformidade: ${Math.round((1 - affineUniformity) * 100)}%).`;
      } else if (detectedMotionType === 'TALKING_AVATAR_2D') {
        validationMessage = `Movimento detectado como articulação 2D / envelope de áudio (Variância: ${temporalVariance}%).`;
      } else {
        validationMessage = 'Alerta: vídeo detectado como estático ou zoom linear simples.';
      }

      return {
        isGenerativeMotion,
        overallMotionScore,
        temporalVariance,
        affineUniformity: Math.round(affineUniformity * 100) / 100,
        opticalFlowScore,
        detectedMotionType,
        validationMessage,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
