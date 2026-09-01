export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'shopee' | 'mercado_livre';
export type SocialPostStatus = 'draft' | 'approved' | 'queued' | 'published' | 'failed';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  profileId?: string;
  displayName: string;
  handle?: string;
  status: 'connected' | 'expired' | 'disconnected';
}

export interface SocialMediaAsset {
  id: string;
  profileId?: string;
  profileName?: string;
  folder: string;
  relativeFolder: string;
  fileName: string;
  kind: 'video' | 'image';
  url: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface SocialPost {
  id: string;
  profileId: string;
  profileName: string;
  productId?: string;
  productName?: string;
  shoppingUrl?: string;
  purchasePlacement?: 'description' | 'pinned_comment';
  purchaseText?: string;
  platform: SocialPlatform;
  accountIds: string[];
  mediaId: string;
  scheduledAt: string;
  caption: string;
  hashtags: string[];
  objective: 'alcance' | 'relacionamento' | 'autoridade' | 'conversao';
  status: SocialPostStatus;
  createdAt: string;
  publishedAt?: string;
  platformPostId?: string;
  error?: string;
}

export interface SocialTrendSnapshot {
  refreshedAt: string;
  nextRefreshAt: string;
  cadenceHours: 5;
  source: 'baseline' | 'connected_metrics';
  platformSignals: Record<SocialPlatform, {
    peakHours: string[];
    recommendedHashtagCount: number;
    notes: string[];
  }>;
}

export interface SocialCenterState {
  version: 1;
  posts: SocialPost[];
  trends: SocialTrendSnapshot;
  lastMediaScanAt?: string;
  mediaProductLinks?: Record<string, string>;
  accounts?: SocialAccount[];
}
