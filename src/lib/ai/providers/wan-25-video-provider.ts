import {
  CommercialLicenseInfo,
  HardwareProfile,
  ProviderCapabilities,
  VideoGenerateParams,
  VideoGenerateResult,
  VideoProvider,
  VideoProviderLevel,
  VideoQualityTier,
} from '../engine/interfaces';

export class Wan25VideoProvider implements VideoProvider {
  readonly id = 'wan-2.5-video';
  readonly name = 'wan-2.5-video';
  readonly model = 'wan-2.5-i2v-14b';
  readonly endpoint = 'fal-ai/wan-25-i2v';
  readonly serviceType = 'video' as const;
  readonly isGenerative = true;
  readonly isLocal = false;
  readonly recommendedHardware: HardwareProfile = 'REMOTE';
  readonly providerLevel: VideoProviderLevel = 'LEVEL_2_GENERATIVE_I2V';
  readonly qualityTier: VideoQualityTier = 'maximum';

  readonly capabilities: ProviderCapabilities = {
    supportsReferenceImage: true,
    supportsMultipleReferences: false,
    supportsCharacterConsistency: true,
    supportsProductReference: true,
    supportsAudioConditioning: true,
    supportsLipSync: true,
  };

  readonly license: CommercialLicenseInfo = {
    licenseName: 'Apache-2.0',
    isCommercialAllowed: true,
    attributionRequired: false,
    licenseUrl: 'https://github.com/Wan-Video/Wan2.1',
  };

  async isConfigured(): Promise<boolean> {
    return Boolean(process.env.FAL_KEY || process.env.REPLICATE_API_TOKEN);
  }

  async isAvailable(): Promise<boolean> {
    return false; // Reserved for Step 2 Benchmark after LTX evaluation
  }

  estimateCost(params: VideoGenerateParams): { credits: number; usdEstimate: number } {
    const duration = params.durationSeconds || 15;
    // $0.04 per second for Wan 2.5 14B
    const usdEstimate = parseFloat((duration * 0.04).toFixed(4));
    return { credits: Math.round(duration * 4), usdEstimate };
  }

  async generateVideo(params: VideoGenerateParams): Promise<VideoGenerateResult> {
    throw new Error(
      'Wan 2.5 Video Adapter está preparado mas aguarda decisão manual após o teste inicial de R$5 do LTX-Video.'
    );
  }
}

export const wan25VideoProvider = new Wan25VideoProvider();
