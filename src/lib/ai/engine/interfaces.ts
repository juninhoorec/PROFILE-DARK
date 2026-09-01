export type ProviderServiceType =
  | 'image'
  | 'voice'
  | 'video'
  | 'lip_sync'
  | 'vision'
  | 'upscale'
  | 'workflow'
  | 'llm';

export type HardwareProfile = 'LOW' | 'MEDIUM' | 'HIGH' | 'REMOTE';

export interface CommercialLicenseInfo {
  licenseName: string;
  isCommercialAllowed: boolean;
  attributionRequired: boolean;
  licenseUrl?: string;
  notes?: string;
}

export interface ProviderCapabilities {
  supportsReferenceImage: boolean;
  supportsMultipleReferences: boolean;
  supportsCharacterConsistency: boolean;
  supportsProductReference: boolean;
  supportsAudioConditioning: boolean;
  supportsLipSync: boolean;
  supportsInpainting?: boolean;
  supportsControlNet?: boolean;
  supportsStreaming?: boolean;
}

export interface BaseProvider {
  readonly id: string;
  readonly name: string;
  readonly serviceType: ProviderServiceType;
  readonly capabilities: ProviderCapabilities;
  readonly isLocal: boolean;
  readonly license: CommercialLicenseInfo;
  readonly minVramGb?: number;
  readonly recommendedHardware: HardwareProfile;

  isConfigured(): boolean | Promise<boolean>;
  isAvailable(): boolean | Promise<boolean>;
  estimateCost(input: any): { credits: number; usdEstimate?: number };
}

// --- Image Provider ---
export interface ImageGenerateParams {
  prompt: string;
  negativePrompt?: string;
  referenceUrl?: string;
  referenceUrls?: string[];
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5';
  resolution?: { width: number; height: number };
  realismLevel?: 'natural' | 'realista' | 'ultra-realista';
  seed?: number;
  steps?: number;
  guidanceScale?: number;
  profileId?: string;
  productId?: string;
  ipAdapterStrength?: number;
}

export interface ImageGenerateResult {
  url: string;
  localPath?: string;
  width: number;
  height: number;
  seed: number;
  model: string;
  provider: string;
  generationTimeMs: number;
  costCredits: number;
}

export interface ImageProvider extends BaseProvider {
  readonly serviceType: 'image';
  generateImage(params: ImageGenerateParams): Promise<ImageGenerateResult>;
}

// --- Voice Provider ---
export interface VoiceGenerateParams {
  text: string;
  voiceName?: string;
  voiceReferenceUrl?: string;
  language?: string; // default pt-BR
  accent?: string;
  speed?: number; // 0.8 - 1.5
  energy?: number;
  emotion?: 'neutral' | 'friendly' | 'excited' | 'authoritative' | 'calm';
  profileId?: string;
  isAuthorizedVoiceClone?: boolean;
}

export interface WordTimestamp {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SentenceTimestamp {
  sentence: string;
  startSec: number;
  endSec: number;
}

export interface VoiceGenerateResult {
  audioUrl: string;
  localPath?: string;
  durationSeconds: number;
  sampleRate: number;
  format: 'wav' | 'mp3' | 'aac';
  wordTimestamps?: WordTimestamp[];
  sentenceTimestamps?: SentenceTimestamp[];
  model: string;
  provider: string;
  generationTimeMs: number;
  costCredits: number;
}

export interface VoiceProvider extends BaseProvider {
  readonly serviceType: 'voice';
  generateVoice(params: VoiceGenerateParams): Promise<VoiceGenerateResult>;
}

// --- Video Provider ---
export interface VideoGenerateParams {
  prompt: string;
  imageUrl?: string;
  lastFrameUrl?: string;
  audioUrl?: string;
  durationSeconds: number;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  fps?: number; // default 30
  resolution?: '480p' | '720p' | '1080p';
  seed?: number;
  isSmokeTest?: boolean;
  profileId?: string;
  productId?: string;
  motionIntensity?: number; // 1-10
  mode?: 'i2v' | 't2v' | 's2v' | 'animate';
}

export interface VideoGenerateResult {
  videoUrl: string;
  localPath?: string;
  thumbnailUrl: string;
  actualDurationSeconds: number;
  width: number;
  height: number;
  fps: number;
  providerTaskId?: string;
  model: string;
  provider: string;
  generationTimeMs: number;
  costCredits: number;
}

// --- Video Provider Levels & Status ---
export type VideoProviderLevel =
  | 'LEVEL_0_STATIC_SYNTHESIS'
  | 'LEVEL_1_TALKING_AVATAR_2D'
  | 'LEVEL_2_GENERATIVE_I2V'
  | 'LEVEL_3_GENERATIVE_I2V_WITH_AUDIO'
  | 'LEVEL_4_GENERATIVE_CHARACTER_ANIMATION';

export type VideoQualityTier = 'preview' | 'balanced' | 'maximum';

export type ModelValidationStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'INSTALLED'
  | 'CONNECTED'
  | 'VALIDATED'
  | 'DEGRADED'
  | 'FAILED';

export interface GenerativeMotionScore {
  isGenerativeMotion: boolean;
  overallMotionScore: number;
  temporalVariance: number;
  affineUniformity: number; // Low = non-affine generative deform; High = simple zoom/pan
  opticalFlowScore: number;
  detectedMotionType: 'GENERATIVE_3D_DIFFUSION' | 'TALKING_AVATAR_2D' | 'STATIC_ZOOM_PAN';
  validationMessage: string;
}

export interface VideoProvider extends BaseProvider {
  readonly serviceType: 'video';
  readonly providerLevel: VideoProviderLevel;
  readonly qualityTier: VideoQualityTier;
  readonly isGenerative: boolean;
  generateVideo(params: VideoGenerateParams): Promise<VideoGenerateResult>;
}

// --- LipSync Provider ---
export interface LipSyncParams {
  videoUrl: string;
  audioUrl: string;
  faceMaskPadding?: [number, number, number, number];
  smoothFactor?: number;
  outputPath?: string;
}

export interface LipSyncResult {
  videoUrl: string;
  localPath?: string;
  durationSeconds: number;
  model: string;
  provider: string;
  processingTimeMs: number;
  costCredits: number;
}

export interface LipSyncProvider extends BaseProvider {
  readonly serviceType: 'lip_sync';
  syncLips(params: LipSyncParams): Promise<LipSyncResult>;
}

// --- Vision Provider ---
export interface VisionInspectParams {
  imageUrl?: string;
  videoUrl?: string;
  referenceImageUrl?: string;
  expectedCharacterName?: string;
  expectedProductName?: string;
  sceneDescription?: string;
}

export interface SceneInspectionScore {
  faceConsistencyScore: number; // 0-100
  productConsistencyScore: number; // 0-100
  motionNaturalnessScore: number; // 0-100
  anatomyScore: number; // 0-100
  lightingConsistencyScore: number; // 0-100
  overallScore: number; // 0-100
  verdict: 'PASS' | 'RETRY' | 'MANUAL_REVIEW';
  detectedFlaws: string[];
  recommendation?: string;
}

export interface VisionProvider extends BaseProvider {
  readonly serviceType: 'vision';
  inspectScene(params: VisionInspectParams): Promise<SceneInspectionScore>;
}

// --- Upscale Provider ---
export interface UpscaleParams {
  inputUrl: string;
  targetResolution: '1080p' | '1440p' | '4k';
  scaleFactor?: 2 | 4;
  fidelity?: 'photo' | 'fast' | 'ultra';
  outputPath?: string;
}

export interface UpscaleResult {
  outputUrl: string;
  localPath?: string;
  width: number;
  height: number;
  processingTimeMs: number;
  model: string;
  provider: string;
  costCredits: number;
}

export interface UpscaleProvider extends BaseProvider {
  readonly serviceType: 'upscale';
  upscale(params: UpscaleParams): Promise<UpscaleResult>;
}

// --- ComfyUI Workflow Provider ---
export interface ComfyWorkflowParams {
  workflowName: string;
  inputs: Record<string, any>;
  timeoutMs?: number;
}

export interface ComfyWorkflowResult {
  promptId: string;
  outputs: Record<string, any>;
  mediaUrls: string[];
  executionTimeMs: number;
  nodeHistory: Record<string, any>;
}

export interface ComfyUIProvider extends BaseProvider {
  readonly serviceType: 'workflow';
  submitWorkflow(params: ComfyWorkflowParams): Promise<ComfyWorkflowResult>;
  getQueue(): Promise<{ pending: number; running: number }>;
  getHistory(promptId: string): Promise<any>;
  cancelJob(promptId: string): Promise<boolean>;
}
