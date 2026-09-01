import fs from 'node:fs/promises';
import path from 'node:path';
import { Product, Profile } from '../../types';
import { Campaign, VideoProject } from './interfaces';
import { BatchCreativeDirector } from './batch-creative-director';
import { ProductionPipeline } from './production-pipeline';

export class CampaignManager {
  private static campaignsDir = path.join(process.cwd(), 'data', 'campaigns');

  /**
   * Initializes and executes a 3-video commercial campaign for a Profile and Product.
   */
  static async createAndExecuteCampaign(params: {
    title: string;
    profile: Profile;
    product: Product;
    affiliateUrl?: string;
    qualityTier?: 'preview' | 'balanced' | 'maximum';
  }): Promise<Campaign> {
    const { title, profile, product, affiliateUrl, qualityTier = 'balanced' } = params;

    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await fs.mkdir(this.campaignsDir, { recursive: true });

    // 1. Generate 3 Diverse Creative Plans
    const batchPlans = BatchCreativeDirector.generateBatchPlans({
      profile,
      product,
      campaignId,
    });

    const videoProjects: VideoProject[] = [];
    let totalSeconds = 0;

    // 2. Execute each project in the campaign
    for (const plan of batchPlans.plans) {
      console.log(`\n[CampaignManager] Executando Projeto ${plan.commercialAngle} (${plan.title})...`);
      const project = await ProductionPipeline.runProject({
        plan,
        profile,
        product,
        qualityTier,
      });
      project.campaignId = campaignId;
      videoProjects.push(project);
      totalSeconds += project.durationSeconds;
    }

    const campaign: Campaign = {
      id: campaignId,
      title,
      profileId: profile.id,
      productId: product.id,
      affiliateUrl,
      status: 'COMPLETED',
      videoProjects,
      totalGenerationSeconds: totalSeconds,
      totalCostUsd: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const campaignFile = path.join(this.campaignsDir, `${campaignId}.json`);
    await fs.writeFile(campaignFile, JSON.stringify(campaign, null, 2), 'utf8');

    return campaign;
  }

  /**
   * Loads an existing campaign from disk.
   */
  static async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const campaignFile = path.join(this.campaignsDir, `${campaignId}.json`);
      const raw = await fs.readFile(campaignFile, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
