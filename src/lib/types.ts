export type FunnelStage = 'topo' | 'meio' | 'fundo';

export type CommercialObjective =
  | 'conversao'
  | 'descoberta'
  | 'retargeting'
  | 'demonstracao'
  | 'autoridade'
  | 'prova_social'
  | 'lifestyle'
  | 'review'
  | 'storytelling'
  | 'ugc';

export type RealismLevel = 'natural' | 'realista' | 'ultra-realista';

export interface CharacterLock {
  face: boolean;
  age: boolean;
  hair: boolean;
  body: boolean;
  voice: boolean;
  personality: boolean;
}

export interface ProfileDNA {
  name: string;
  ageApparent: number;
  nationality: string;
  niche: string;
  subNiche: string;
  personality: string;
  toneOfVoice: string;
  speechPattern: string;
  visualAppearance: string;
  wardrobeStyle: string;
  environmentPreference: string;
  voiceStyle: string;
  voiceLanguage: string;
  suggestedUsernames: string[];
  targetAudience: string;
  buyerPersona: string;
  primaryCommercialGoal: CommercialObjective;
  mainCTA: string;
  secondaryCTA: string;
  salesStyle: string;
  aggressivenessLevel: 'sutil' | 'moderado' | 'direto';
  editorialStrategy: string;
  initialIdeas: string[];
  imageGenerationPrompt?: string;
  masterNegativePrompt?: string;
}

export interface ProfileReference {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  isMaster: boolean;
  label?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  niche: string;
  personality: string;
  toneOfVoice: string;
  voiceName: string;
  voiceSampleUrl?: string;
  realismScore: number;
  language: string;
  characterLock: CharacterLock;
  dna: ProfileDNA;
  references: ProfileReference[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductLock {
  logo: boolean;
  color: boolean;
  shape: boolean;
  material: boolean;
  packaging: boolean;
  text: boolean;
  details: boolean;
}

export interface ProductDNA {
  name: string;
  brand: string;
  category: string;
  keyFeatures: string[];
  colors: string[];
  shape: string;
  packagingDetails: string;
  mainBenefits: string[];
  problemSolved: string;
  desireExploited: string;
  price?: string;
  specialOffer?: string;
  checkoutUrl?: string;
  targetAudience: string;
  commonObjections: string[];
  primaryDifferentiator: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  price?: string;
  offer?: string;
  buyUrl?: string;
  productLock: ProductLock;
  dna: ProductDNA;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AffiliatePlatform =
  | 'shopee' | 'mercado_livre' | 'shein' | 'tiktok_shop' | 'amazon'
  | 'aliexpress' | 'hotmart' | 'kiwify' | 'eduzz' | 'monetizze' | 'braip' | 'universal';

export interface AffiliateLink {
  id: string;
  productId?: string;
  affiliateUrl: string;
  resolvedUrl?: string;
  platform: AffiliatePlatform;
  trackingPreserved: boolean;
  resolutionSource: 'structured_data' | 'open_graph' | 'html' | 'manual_required';
  createdAt: string;
}

export interface ProfileProductMatch {
  id: string;
  name: string;
  age: string;
  archetype: string;
  contentStyle: string;
  rationale: string;
  fitScore: number;
  dimensions: {
    audienceFit: number;
    productCredibility: number;
    naturalUsage: number;
    contentPotential: number;
    trustPotential: number;
    commercialPotential: number;
    productionEase: number;
    repeatability: number;
  };
}

export interface CreativeScene {
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  visualPrompt: string;
  cameraMovement: string;
  lightingStyle: string;
  narrationScript: string;
  productInteraction: string;
  characterAction: string;
  assetUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface CreativePlan {
  id: string;
  profileId: string;
  productId?: string;
  format: 'reels' | 'shorts' | 'tiktok' | 'youtube';
  objective: CommercialObjective;
  funnelStage: FunnelStage;
  targetDurationSeconds: number;
  hook: string;
  creativeAngle: string;
  fullScript: string;
  scenes: CreativeScene[];
  ctaText: string;
  captionText: string;
  hashtags: string[];
  thumbnailPrompt: string;
  thumbnailUrl?: string;
  estimatedCredits: number;
  createdAt: string;
}

export type JobStatus =
  | 'aguardando'
  | 'preparando'
  | 'gerando'
  | 'gerando_roteiro'
  | 'gerando_video'
  | 'renderizando'
  | 'concluido'
  | 'falhou'
  | 'cancelado';

export interface PipelineStage {
  id: 'context' | 'script' | 'audio' | 'scene_1' | 'scene_2' | 'scene_3' | 'render' | 'quality_check';
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface GenerationJob {
  id: string;
  title: string;
  profileId: string;
  profileName: string;
  profileAvatarUrl: string;
  productId?: string;
  productName?: string;
  campaignName?: string;
  creativePlanId?: string;
  creativePlan?: CreativePlan;
  status: JobStatus;
  progress: number;
  durationSeconds: number;
  resolution: '720p' | '1080p' | '1440p' | '4k';
  aspectRatio: '9:16' | '16:9' | '1:1';
  fps: 24 | 30 | 60;
  videoUrl?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  srtUrl?: string;
  pipeline: PipelineStage[];
  providerUsed?: string;
  modelUsed?: string;
  qualityScore?: number;
  isSmokeTest?: boolean;
  isDemo?: boolean;
  costCredits: number;
  errorMessage?: string;
  userFriendlyError?: string;
  retryCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface QualityMetrics {
  realism: number; // 0-100
  identity: number; // 0-100
  product: number; // 0-100
  motion: number; // 0-100
  overallQuality: number; // 0-100
}

export interface QualityCheckDetail {
  faceConsistent: boolean;
  productConsistent: boolean;
  lipSyncAccurate: boolean;
  audioClear: boolean;
  captionsSynced: boolean;
  resolutionValid: boolean;
  aspectRatioValid: boolean;
  durationValid: boolean;
  artifactsDetected: boolean;
  ctaLegible: boolean;
  brandSafe: boolean;
  issues: string[];
  suggestedFix?: string;
  autoFixAvailable: boolean;
  targetSceneForFix?: number;
}

export interface QualityCheck {
  id: string;
  jobId: string;
  status: 'passed' | 'needs_review' | 'failed';
  metrics: QualityMetrics;
  details: QualityCheckDetail;
  inspectedAt: string;
}

export interface DarkRadarConcept {
  id: string;
  name: string;
  category: string;
  tag: string;
  imageUrl: string;
  opportunityScore: number; // 0-100
  commercialPotential: 'Extremo' | 'Alto' | 'Médio-Alto' | 'Estratégico';
  productionComplexity: 'Baixa' | 'Média' | 'Avançada';
  targetAudience: string;
  possibleProducts: string[];
  recommendedFormats: string[];
  suggestedProfileDNA: Partial<ProfileDNA>;
  isHot?: boolean;
}

export interface ProviderHealth {
  service: 'llm' | 'image' | 'voice' | 'talking_head' | 'video' | 'render' | 'storage';
  name: string;
  status: 'operational' | 'degraded' | 'unavailable' | 'not_configured';
  latencyMs: number;
  successRate: number;
  lastChecked: string;
  lastError?: string;
  costPerUnit?: string;
  isConfigured: boolean;
}

export interface UserCredits {
  userId: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  planName: string;
  renewalDate: string;
}

export interface CreditTransaction {
  id: string;
  jobId?: string;
  amount: number;
  type: 'reserve' | 'charge' | 'refund' | 'grant';
  description: string;
  createdAt: string;
}

export interface MediaLibraryItem {
  id: string;
  title: string;
  profileName: string;
  profileAvatarUrl: string;
  productName?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  duration: string;
  resolution: string;
  status: 'concluido' | 'renderizando' | 'falhou';
  progress?: number;
  createdAt: string;
  tags: string[];
  fileSizeMb: number;
  isDemo?: boolean;
}
