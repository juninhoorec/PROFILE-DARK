import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { runProcess } from '../../local-media';

const ffmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

export interface ContactSheetOptions {
  videoPath: string;
  outputPath?: string;
  outputSheetPath?: string;
  durationSeconds?: number;
  percentages?: number[];
}

export class ContactSheetGenerator {
  /**
   * Extracts evenly distributed frames and composites them into a contact-sheet.jpg grid.
   */
  static async generateContactSheet(
    videoPathOrOptions: string | ContactSheetOptions,
    outputSheetPathArg?: string,
    durationSecondsArg = 3
  ): Promise<{ contactSheetPath: string; framePaths: string[]; percentages: number[] }> {
    let videoPath: string;
    let outputSheetPath: string;
    let durationSeconds = durationSecondsArg;
    let percentages = [0, 14, 28, 42, 56, 70, 84, 100];

    if (typeof videoPathOrOptions === 'object') {
      videoPath = videoPathOrOptions.videoPath;
      outputSheetPath = (videoPathOrOptions.outputPath || videoPathOrOptions.outputSheetPath)!;
      if (videoPathOrOptions.durationSeconds) durationSeconds = videoPathOrOptions.durationSeconds;
      if (videoPathOrOptions.percentages) percentages = videoPathOrOptions.percentages;
    } else {
      videoPath = videoPathOrOptions;
      outputSheetPath = outputSheetPathArg!;
    }

    const tempDir = path.join(
      process.cwd(),
      'data',
      'contact-sheet-temp',
      `cs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    );
    await fs.mkdir(tempDir, { recursive: true });

    const framePaths: string[] = [];

    try {
      const safeDuration = Math.max(0.6, durationSeconds);

      for (let i = 0; i < percentages.length; i++) {
        const pct = percentages[i];
        const rawTs = (pct / 100) * (safeDuration - 0.2);
        const ts = Math.max(0.05, Math.min(safeDuration - 0.15, rawTs));
        const frameFile = path.join(tempDir, `frame_${i}_${pct}pct.jpg`);

        try {
          await runProcess(
            ffmpeg,
            [
              '-y',
              '-ss',
              ts.toFixed(2),
              '-i',
              videoPath,
              '-vframes',
              '1',
              '-q:v',
              '2',
              frameFile,
            ],
            30_000
          );
        } catch {
          // fallback frame extraction at 0s
          try {
            await runProcess(
              ffmpeg,
              ['-y', '-ss', '0.05', '-i', videoPath, '-vframes', '1', '-q:v', '2', frameFile],
              30_000
            );
          } catch {
            // ignore
          }
        }

        // Verify physical existence
        const exists = await fs.stat(frameFile).then(() => true).catch(() => false);
        if (!exists) {
          // Fallback to first existing frame or create fallback image
          if (framePaths.length > 0) {
            await fs.copyFile(framePaths[0], frameFile);
          } else {
            await sharp({
              create: {
                width: 720,
                height: 1280,
                channels: 3,
                background: { r: 30, g: 30, b: 35 },
              },
            })
              .jpeg()
              .toFile(frameFile);
          }
        }
        framePaths.push(frameFile);
      }

      // Build Composite Grid (e.g. 4 cols x 2 rows, or 3 cols x 2 rows)
      const cols = percentages.length <= 6 ? 3 : 4;
      const rows = Math.ceil(percentages.length / cols);
      const thumbWidth = 270;
      const thumbHeight = 480;

      const resizedBuffers = await Promise.all(
        framePaths.map(async (fPath, idx) => {
          const pct = percentages[idx];
          const img = sharp(fPath).resize(thumbWidth, thumbHeight, { fit: 'cover' });

          // Overlay percentage stamp badge
          const badgeSvg = Buffer.from(
            `<svg width="${thumbWidth}" height="40">
              <rect x="8" y="8" width="65" height="24" rx="4" fill="black" fill-opacity="0.75"/>
              <text x="40" y="24" font-family="sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${pct}%</text>
            </svg>`
          );
          return img.composite([{ input: badgeSvg, top: 0, left: 0 }]).toBuffer();
        })
      );

      const compositeItems: Array<{ input: Buffer; left: number; top: number }> = [];
      for (let i = 0; i < resizedBuffers.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        compositeItems.push({
          input: resizedBuffers[i],
          left: col * thumbWidth,
          top: row * thumbHeight,
        });
      }

      await fs.mkdir(path.dirname(outputSheetPath), { recursive: true });

      await sharp({
        create: {
          width: thumbWidth * cols,
          height: thumbHeight * rows,
          channels: 3,
          background: { r: 15, g: 15, b: 18 },
        },
      })
        .composite(compositeItems)
        .jpeg({ quality: 90 })
        .toFile(outputSheetPath);

      return {
        contactSheetPath: outputSheetPath,
        framePaths,
        percentages,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
