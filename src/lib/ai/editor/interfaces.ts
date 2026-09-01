import { Product, Profile } from '../../types';
import { VideoQualityTier } from '../engine/interfaces';

export interface TakeScoreBreakdownV2 {
  face: number;
  motion: number;
  lipSync: number;
  realism: number;
  continuity: number;
  product: number;
  hands: number;
  overall: number;
  isGenerative: boolean;
}

export interface TakeCandidateV2 {
  id: 'Take A' | 'Take B' | 'Take C' | 'Take Repair';
  takeNumber: number;
  seed: number;
  videoUrl: string;
  videoPath?: string;
  rawVideoPath?: string;
  lipsyncVideoPath?: string;
  audioUrl?: string;
  durationSeconds: number;
  extractedFramePaths: string[];
  scores: TakeScoreBreakdownV2;
  flaws: string[];
  selected: boolean;
  notes?: string;
  repaired?: boolean;
}

export interface MultiTakeSceneResultV2 {
  sceneNumber: number;
  sceneTitle: string;
  sceneType: 'character_talking' | 'character_movement' | 'product_closeup' | 'b_roll';
  durationSeconds: number;
  takes: TakeCandidateV2[];
  bestTake: TakeCandidateV2;
  selectionRationale: string;
  repairAttempted: boolean;
  qualityTierUsed: VideoQualityTier;
}

export interface AgentEditorParamsV2 {
  profile: Profile;
  product?: Product;
  sceneTitle?: string;
  promptText?: string;
  durationSeconds?: number;
  sceneType?: 'character_talking' | 'character_movement' | 'product_closeup' | 'b_roll';
  qualityTier?: VideoQualityTier;
  previousLastFramePath?: string;
}

// Backward-compatible type aliases for V1
export type TakeScoreBreakdown = TakeScoreBreakdownV2;
export type TakeCandidate = TakeCandidateV2;
export type MultiTakeSceneResult = MultiTakeSceneResultV2;
export type AgentEditorParams = AgentEditorParamsV2;
