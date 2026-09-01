import { Product, Profile } from '../../types';

export type ProductionProjectState =
  | 'DRAFT'
  | 'PLANNING'
  | 'VOICE_READY'
  | 'GENERATING_SCENES'
  | 'SCENE_QA'
  | 'SCENE_REPAIR'
  | 'EDITING'
  | 'LIPSYNC'
  | 'RENDERING'
  | 'FINAL_QA'
  | 'COMPLETED'
  | 'NEEDS_REVIEW'
  | 'FAILED'
  | 'CANCELLED';

export interface SceneProviderTrace {
  sceneNumber: number;
  sceneTitle: string;
  provider: string; // e.g. "remote-comfyui", "local-talking-avatar", "wan-video-provider"
  model: string; // e.g. "wan-2.2-i2v", "local-talking-avatar-2d"
  generationType: 'GENERATIVE_I2V' | 'TALKING_AVATAR_2D' | 'STATIC_SYNTHESIS' | 'B_ROLL';
  fallbackUsed: boolean;
  fallbackReason: string;
  generationTimeSeconds: number;
  measuredCost: number;
  qualityScore: number;
}

export interface GenerationManifest {
  projectId: string;
  campaignId?: string;
  profileId: string;
  profileName: string;
  productId?: string;
  productName?: string;
  durationSeconds: number;
  scenes: SceneProviderTrace[];
  providers: string[];
  models: string[];
  takesGenerated: number;
  repairsApplied: number;
  fallbacksRecorded: number;
  voiceProvider: string;
  lipSyncProvider: string;
  sourceResolution: string;
  finalResolution: string;
  upscaled: boolean;
  creditsCharged: number;
  providerCostUsd: number;
  generationTimeSeconds: number;
  visualQualityScore: number;
  commercialQualityScore: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface ProjectCheckpoint {
  projectId: string;
  state: ProductionProjectState;
  completedSceneNumbers: number[];
  sceneVideoPaths: Record<number, string>;
  sceneAudioPaths: Record<number, string>;
  lastApprovedFramePaths: Record<number, string>;
  fullAudioPath?: string;
  finalVideoPath?: string;
  lastSavedAt: string;
}

export interface CommercialQualityReport {
  hookClarity: number;
  productClarity: number;
  benefitClarity: number;
  audienceFit: number;
  objectionHandling: number;
  ctaStrength: number;
  overallCommercialScore: number;
  summary: string;
}

export interface VideoProject {
  id: string;
  campaignId?: string;
  title: string;
  commercialAngle: 'PROBLEM_SOLUTION' | 'REVIEW_EXPERIENCE' | 'LIFESTYLE_DEMO';
  profile: Profile;
  product?: Product;
  state: ProductionProjectState;
  durationSeconds: number;
  manifest?: GenerationManifest;
  checkpoint?: ProjectCheckpoint;
  finalVideoUrl?: string;
  finalVideoPath?: string;
  audioUrl?: string;
  socialCaption?: {
    caption: string;
    hashtags: string[];
    ctaText: string;
  };
  visualQualityScore: number;
  commercialQualityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  profileId: string;
  productId?: string;
  affiliateUrl?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  videoProjects: VideoProject[];
  totalGenerationSeconds: number;
  totalCostUsd: number;
  createdAt: string;
  updatedAt: string;
}
