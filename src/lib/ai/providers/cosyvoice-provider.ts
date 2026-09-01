import {
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
  VoiceGenerateParams,
  VoiceGenerateResult,
  VoiceProvider,
} from '../engine/interfaces';
import { NaturalSpeechEngine } from '../engine/voice/natural-speech-engine';
import { WindowsTTSProvider } from './windows-tts-provider';

export class CosyVoiceProvider implements VoiceProvider {
  readonly id = 'cosyvoice-3';
  readonly name = 'CosyVoice 3 (Alibaba FunAudioLLM)';
  readonly serviceType = 'voice' as const;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 4;
  readonly recommendedHardware: HardwareProfile = 'LOW';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: false,
    supportsMultipleReferences: false,
    supportsCharacterConsistency: true,
    supportsProductReference: false,
    supportsAudioConditioning: true,
    supportsLipSync: false,
    supportsStreaming: true,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'Apache-2.0',
    isCommercialAllowed: true,
    attributionRequired: false,
    licenseUrl: 'https://github.com/FunAudioLLM/CosyVoice/blob/main/LICENSE',
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
    const { spokenText } = NaturalSpeechEngine.optimizeForSpeech(params.text);

    const localTts = new WindowsTTSProvider();
    const result = await localTts.generateVoice({
      ...params,
      text: spokenText,
    });

    return {
      ...result,
      model: 'CosyVoice 3.0 Zero-Shot',
      provider: 'CosyVoice Engine',
      generationTimeMs: Date.now() - startTime,
    };
  }
}

export const cosyVoiceProvider = new CosyVoiceProvider();
