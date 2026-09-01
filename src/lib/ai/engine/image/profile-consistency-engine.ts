import { Profile, ProfileDNA, ProfileReference } from '../../../types';

export type ReferenceAngle =
  | 'front'
  | '3-quarter-left'
  | '3-quarter-right'
  | 'side-left'
  | 'side-right'
  | 'full-body'
  | 'smile'
  | 'neutral'
  | 'talking';

export interface ReferencePackItem {
  id: string;
  angle: ReferenceAngle;
  url: string;
  label: string;
  isMaster: boolean;
  createdAt: string;
}

export interface ProfileReferencePack {
  profileId: string;
  masterImage: ReferencePackItem;
  views: ReferencePackItem[];
  ipAdapterEmbeddingsUrl?: string;
  faceIdVectors?: number[];
  updatedAt: string;
}

export class ProfileConsistencyEngine {
  /**
   * Builds the comprehensive reference conditioning payload for any image/video provider.
   */
  static buildConditioningContext(profile: Profile, targetAngle?: ReferenceAngle) {
    const references = profile.references || [];
    const master = references.find((r) => r.isMaster) || references[0];

    const angleRef = targetAngle
      ? references.find((r) => r.label?.toLowerCase().includes(targetAngle.replace('-', ' ')))
      : undefined;

    const primaryUrl = angleRef?.url || master?.url || profile.avatarUrl;
    const secondaryUrls = references
      .filter((r) => r.url !== primaryUrl)
      .slice(0, 3)
      .map((r) => r.url);

    return {
      profileId: profile.id,
      name: profile.name,
      primaryReferenceUrl: primaryUrl,
      multiReferenceUrls: [primaryUrl, ...secondaryUrls],
      characterLock: profile.characterLock,
      permanentDNA: {
        visualAppearance: profile.dna?.visualAppearance,
        age: profile.dna?.ageApparent,
        wardrobe: profile.dna?.wardrobeStyle,
        personality: profile.dna?.personality,
        environment: profile.dna?.environmentPreference,
      },
      hasVisualReference: Boolean(primaryUrl && !primaryUrl.includes('placeholder')),
    };
  }

  /**
   * Generates suggested prompt extensions for a specific angle in the reference pack.
   */
  static getAnglePrompt(angle: ReferenceAngle, basePrompt: string): string {
    const angleDirectives: Record<ReferenceAngle, string> = {
      'front': 'Front-facing eye-level camera portrait, looking directly into the lens, neutral eye contact.',
      '3-quarter-left': 'Three-quarter view turned slightly to the left, natural catchlights in eyes, soft depth.',
      '3-quarter-right': 'Three-quarter view turned slightly to the right, dynamic cheekbone lighting.',
      'side-left': 'Profile side view facing left, clean silhouette, visible jawline definition.',
      'side-right': 'Profile side view facing right, clean silhouette, authentic hair texture.',
      'full-body': 'Full-body standing shot, full posture visible from head to shoes, balanced natural stance.',
      'smile': 'Warm authentic gentle smile with slight laugh lines around eyes, natural teeth showing slightly.',
      'neutral': 'Calm relaxed neutral facial expression, authentic resting face.',
      'talking': 'Mid-sentence oral expression, mouth slightly open pronouncing vowels, animated expressive brows.',
    };

    const directive = angleDirectives[angle] || angleDirectives.front;
    return `${basePrompt}\n[SHOT DIRECTIVE - ${angle.toUpperCase()}]: ${directive}`;
  }

  /**
   * Formats initial references into a structured Reference Pack.
   */
  static createInitialReferencePack(profile: Profile): ProfileReferencePack {
    const masterItem: ReferencePackItem = {
      id: `ref_master_${profile.id}`,
      angle: 'front',
      url: profile.avatarUrl,
      label: 'Foto Mestre Frontal',
      isMaster: true,
      createdAt: new Date().toISOString(),
    };

    const existingViews: ReferencePackItem[] = (profile.references || [])
      .filter((r) => r.url !== profile.avatarUrl)
      .map((r, idx) => ({
        id: r.id,
        angle: (r.label?.toLowerCase() as ReferenceAngle) || '3-quarter-left',
        url: r.url,
        label: r.label || `Referência ${idx + 1}`,
        isMaster: false,
        createdAt: r.createdAt,
      }));

    return {
      profileId: profile.id,
      masterImage: masterItem,
      views: existingViews,
      updatedAt: new Date().toISOString(),
    };
  }
}
