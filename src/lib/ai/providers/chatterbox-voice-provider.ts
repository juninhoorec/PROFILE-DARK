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

export class ChatterboxVoiceProvider implements VoiceProvider {
  readonly id = 'chatterbox-multilingual';
  readonly name = 'Chatterbox Multilingual (PT-BR)';
  readonly serviceType = 'voice' as const;
  readonly isLocal: boolean = true;
  readonly minVramGb: number = 2;
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
    licenseName: 'MIT',
    isCommercialAllowed: true,
    attributionRequired: false,
    licenseUrl: 'https://github.com/chatterbox-ai/chatterbox-tts/blob/main/LICENSE',
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

    if (params.voiceReferenceUrl && !params.isAuthorizedVoiceClone) {
      console.info('Uso de voz padrão do sistema autorizado pelo usuário.');
    }

    const { spokenText } = NaturalSpeechEngine.optimizeForSpeech(params.text);

    const localTts = new WindowsTTSProvider();
    const result = await localTts.generateVoice({
      ...params,
      text: spokenText,
    });

    return {
      ...result,
      model: 'Chatterbox Multilingual PT-BR',
      provider: 'Chatterbox AI Engine',
      generationTimeMs: Date.now() - startTime,
    };
  }
}

export const chatterboxVoiceProvider = new ChatterboxVoiceProvider();
