import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
  SentenceTimestamp,
  VoiceGenerateParams,
  VoiceGenerateResult,
  VoiceProvider,
  WordTimestamp,
} from '../engine/interfaces';
import { newUploadPath, runProcess } from '../../local-media';

export class WindowsTTSProvider implements VoiceProvider {
  readonly id = 'windows-tts';
  readonly name = 'Windows SAPI / Local TTS';
  readonly serviceType = 'voice' as const;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 0;
  readonly recommendedHardware: HardwareProfile = 'LOW';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: false,
    supportsMultipleReferences: false,
    supportsCharacterConsistency: true,
    supportsProductReference: false,
    supportsAudioConditioning: false,
    supportsLipSync: false,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'Microsoft OS Built-in',
    isCommercialAllowed: true,
    attributionRequired: false,
  };

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  estimateCost(): { credits: number; usdEstimate: number } {
    return { credits: 0, usdEstimate: 0 };
  }

  async generateVoice(params: VoiceGenerateParams): Promise<VoiceGenerateResult> {
    const startTime = Date.now();
    const asset = await newUploadPath('wav');
    const jobsDir = path.join(process.cwd(), 'data', 'temp-tts');
    await fs.mkdir(jobsDir, { recursive: true });

    const textFile = path.join(jobsDir, `tts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.txt`);
    const powershell = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

    try {
      await fs.writeFile(textFile, params.text, 'utf8');
      const voice = params.voiceName || process.env.LOCAL_TTS_VOICE || 'Microsoft Maria Desktop';
      const rate = params.speed !== undefined ? (params.speed > 1 ? '2' : params.speed < 1 ? '-2' : '0') : '0';

      await runProcess(
        powershell,
        [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          path.join(process.cwd(), 'scripts', 'synthesize-windows-voice.ps1'),
          '-TextFile',
          textFile,
          '-OutputFile',
          asset.file,
          '-Voice',
          voice,
          '-Rate',
          rate,
        ],
        60_000
      );

      const stats = await fs.stat(asset.file);
      const durationSeconds = Math.max(1, Math.round((stats.size / 88200) * 10) / 10);

      const words = params.text.split(/\s+/).filter(Boolean);
      const timePerWord = durationSeconds / Math.max(1, words.length);
      const wordTimestamps: WordTimestamp[] = words.map((w, idx) => ({
        word: w,
        startSec: Math.round(idx * timePerWord * 100) / 100,
        endSec: Math.round((idx + 1) * timePerWord * 100) / 100,
      }));

      const sentences = params.text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const timePerSentence = durationSeconds / Math.max(1, sentences.length);
      const sentenceTimestamps: SentenceTimestamp[] = sentences.map((s, idx) => ({
        sentence: s.trim(),
        startSec: Math.round(idx * timePerSentence * 100) / 100,
        endSec: Math.round((idx + 1) * timePerSentence * 100) / 100,
      }));

      return {
        audioUrl: asset.url,
        localPath: asset.file,
        durationSeconds,
        sampleRate: 44100,
        format: 'wav',
        wordTimestamps,
        sentenceTimestamps,
        model: 'Windows Speech SAPI (PT-BR)',
        provider: 'Local TTS Engine',
        generationTimeMs: Date.now() - startTime,
        costCredits: 0,
      };
    } finally {
      await fs.unlink(textFile).catch(() => undefined);
    }
  }
}

export const windowsTTSProvider = new WindowsTTSProvider();
