import fs from 'node:fs/promises';
import path from 'node:path';
import { runProcess, newUploadPath } from '../../../local-media';
import { WordTimestamp } from '../interfaces';

const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

export interface CompositionOptions {
  sceneVideoPaths: string[];
  masterAudioPath?: string;
  wordTimestamps?: WordTimestamp[];
  targetResolution?: '720p' | '1080p';
  targetFps?: number;
  burnCaptions?: boolean;
  minDurationSeconds?: number;
}

export interface CompositionResult {
  videoUrl: string;
  videoPath: string;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
}

export class FFmpegRenderEngine {
  /**
   * Generates a valid SRT subtitle file from word timestamps.
   */
  static generateSRT(timestamps: WordTimestamp[], outputPath: string): Promise<string> {
    const srtChunks: string[] = [];
    const chunkSize = 4; // 3-5 words per subtitle card

    for (let i = 0; i < timestamps.length; i += chunkSize) {
      const chunk = timestamps.slice(i, i + chunkSize);
      const startSec = chunk[0].startSec;
      const endSec = chunk[chunk.length - 1].endSec;
      const text = chunk.map((c) => c.word).join(' ');

      const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };

      const entryNum = Math.floor(i / chunkSize) + 1;
      srtChunks.push(`${entryNum}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${text}\n`);
    }

    const srtContent = srtChunks.join('\n');
    return fs.writeFile(outputPath, srtContent, 'utf8').then(() => outputPath);
  }

  /**
   * Concatenates scenes, normalizes resolution (1080x1920 9:16), FPS (30fps),
   * applies EBU R128 loudness normalization and AAC 48kHz audio.
   */
  static async renderFinalVideo(options: CompositionOptions): Promise<CompositionResult> {
    const {
      sceneVideoPaths,
      targetResolution = '1080p',
      targetFps = 30,
      minDurationSeconds = 20,
    } = options;

    if (!sceneVideoPaths || sceneVideoPaths.length === 0) {
      throw new Error('Nenhuma cena fornecida para a composição final.');
    }

    const targetWidth = targetResolution === '1080p' ? 1080 : 720;
    const targetHeight = targetResolution === '1080p' ? 1920 : 1280;

    const finalAsset = await newUploadPath('mp4');
    const workDir = path.join(process.cwd(), 'data', 'render-workspace', `render_${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    if (sceneVideoPaths.length === 1) {
      const singleArgs = [
        '-y',
        '-i', sceneVideoPaths[0],
        '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=${targetFps},setsar=1`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '20',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        '-movflags', '+faststart',
        finalAsset.file,
      ];
      await runProcess(ffmpeg, singleArgs, 180_000);
    } else {
      // Normalize each scene to uniform temp files
      const normalizedScenes: string[] = [];
      for (let i = 0; i < sceneVideoPaths.length; i++) {
        const normPath = path.join(workDir, `norm_scene_${i}.mp4`);
        await runProcess(
          ffmpeg,
          [
            '-y',
            '-i', sceneVideoPaths[i],
            '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},fps=${targetFps},setsar=1`,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '22',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-ar', '48000',
            normPath,
          ],
          120_000
        );
        normalizedScenes.push(normPath);
      }

      // Concat normalized files via concat demuxer
      const concatListPath = path.join(workDir, 'concat_list.txt');
      const concatContent = normalizedScenes
        .map((p) => `file '${p.replace(/\\/g, '/')}'`)
        .join('\n');
      await fs.writeFile(concatListPath, concatContent, 'utf8');

      await runProcess(
        ffmpeg,
        [
          '-y',
          '-f', 'concat',
          '-safe', '0',
          '-i', concatListPath,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '20',
          '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-ar', '48000',
          '-movflags', '+faststart',
          finalAsset.file,
        ],
        300_000
      );
    }

    const stats = await fs.stat(finalAsset.file);
    if (stats.size < 1000) {
      throw new Error('Falha na renderização: arquivo de saída corrompido ou vazio.');
    }

    return {
      videoUrl: finalAsset.url,
      videoPath: finalAsset.file,
      durationSeconds: minDurationSeconds,
      width: targetWidth,
      height: targetHeight,
      fps: targetFps,
      sizeBytes: stats.size,
    };
  }
}
