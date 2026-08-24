import fs from 'fs';
import path from 'path';
import {
  Profile,
  Product,
  GenerationJob,
  QualityCheck,
  DarkRadarConcept,
  ProviderHealth,
  UserCredits,
  CreditTransaction,
  MediaLibraryItem,
  AffiliateLink,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_PRODUCTS,
  INITIAL_RENDER_JOBS,
  INITIAL_LIBRARY_ITEMS,
  INITIAL_PROVIDER_HEALTH,
  INITIAL_USER_CREDITS,
  DARK_RADAR_CONCEPTS,
} from '../constants';

interface DatabaseSchema {
  version: number;
  profiles: Profile[];
  products: Product[];
  jobs: GenerationJob[];
  qualityChecks: QualityCheck[];
  radarConcepts: DarkRadarConcept[];
  providerHealth: ProviderHealth[];
  credits: UserCredits;
  transactions: CreditTransaction[];
  libraryItems: MediaLibraryItem[];
  affiliateLinks: AffiliateLink[];
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseSchema;
  private isInitialized = false;

  constructor() {
    this.data = this.getDefaultData();
    this.init();
  }

  private getDefaultData(): DatabaseSchema {
    return {
      version: 1,
      profiles: [...INITIAL_PROFILES],
      products: [...INITIAL_PRODUCTS],
      jobs: [...INITIAL_RENDER_JOBS],
      qualityChecks: [],
      radarConcepts: [...DARK_RADAR_CONCEPTS],
      providerHealth: [...INITIAL_PROVIDER_HEALTH],
      credits: { ...INITIAL_USER_CREDITS },
      transactions: [],
      libraryItems: [...INITIAL_LIBRARY_ITEMS],
      affiliateLinks: [],
      updatedAt: new Date().toISOString(),
    };
  }

  private init() {
    if (this.isInitialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            ...this.getDefaultData(),
            ...parsed,
          };
        }
      } else {
        this.save();
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Storage fallback to in-memory store:', e);
      this.isInitialized = true;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      this.data.updatedAt = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database file:', e);
    }
  }

  // --- Profiles ---
  getProfiles(): Profile[] {
    return this.data.profiles;
  }

  getProfileById(id: string): Profile | undefined {
    return this.data.profiles.find((p) => p.id === id);
  }

  saveProfile(profile: Profile): Profile {
    const idx = this.data.profiles.findIndex((p) => p.id === profile.id);
    const updated = { ...profile, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.data.profiles[idx] = updated;
    } else {
      this.data.profiles.unshift(updated);
    }
    this.save();
    return updated;
  }

  deleteProfile(id: string): boolean {
    const len = this.data.profiles.length;
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    if (this.data.profiles.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Products ---
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    const updated = { ...product, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.data.products[idx] = updated;
    } else {
      this.data.products.unshift(updated);
    }
    this.save();
    return updated;
  }

  deleteProduct(id: string): boolean {
    const len = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Generation Jobs ---
  getJobs(): GenerationJob[] {
    return this.data.jobs;
  }

  getJobById(id: string): GenerationJob | undefined {
    return this.data.jobs.find((j) => j.id === id);
  }

  saveJob(job: GenerationJob): GenerationJob {
    const idx = this.data.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.jobs[idx] = job;
    } else {
      this.data.jobs.unshift(job);
    }

    // Also sync to library if completed
    if (job.status === 'concluido' && job.videoUrl) {
      this.syncJobToLibrary(job);
    }

    this.save();
    return job;
  }

  private syncJobToLibrary(job: GenerationJob) {
    const existing = this.data.libraryItems.find((item) => item.id === `lib_${job.id}`);
    const item: MediaLibraryItem = {
      id: `lib_${job.id}`,
      title: job.title,
      profileName: job.profileName,
      profileAvatarUrl: job.profileAvatarUrl,
      productName: job.productName,
      thumbnailUrl: job.thumbnailUrl || job.profileAvatarUrl,
      videoUrl: job.videoUrl,
      audioUrl: job.audioUrl,
      duration: `00:${String(job.durationSeconds).padStart(2, '0')}`,
      resolution: job.resolution.toUpperCase(),
      status: 'concluido',
      createdAt: job.createdAt,
      tags: [job.profileName, job.productName || 'Vídeo'].filter(Boolean) as string[],
      fileSizeMb: Math.round(job.durationSeconds * 1.4 * 10) / 10,
    };
    if (existing) {
      const idx = this.data.libraryItems.findIndex((i) => i.id === item.id);
      this.data.libraryItems[idx] = item;
    } else {
      this.data.libraryItems.unshift(item);
    }
  }

  // --- Quality Checks ---
  getQualityChecks(): QualityCheck[] {
    return this.data.qualityChecks;
  }

  getQualityCheckByJobId(jobId: string): QualityCheck | undefined {
    return this.data.qualityChecks.find((qc) => qc.jobId === jobId);
  }

  saveQualityCheck(qc: QualityCheck): QualityCheck {
    const idx = this.data.qualityChecks.findIndex((q) => q.id === qc.id);
    if (idx >= 0) {
      this.data.qualityChecks[idx] = qc;
    } else {
      this.data.qualityChecks.unshift(qc);
    }
    this.save();
    return qc;
  }

  // --- Dark Radar ---
  getRadarConcepts(): DarkRadarConcept[] {
    return this.data.radarConcepts;
  }

  getRadarConceptById(id: string): DarkRadarConcept | undefined {
    return this.data.radarConcepts.find((c) => c.id === id);
  }

  // --- Provider Health ---
  getProviderHealth(): ProviderHealth[] {
    return this.data.providerHealth;
  }

  updateProviderHealth(service: ProviderHealth['service'], update: Partial<ProviderHealth>) {
    const idx = this.data.providerHealth.findIndex((p) => p.service === service);
    if (idx >= 0) {
      this.data.providerHealth[idx] = {
        ...this.data.providerHealth[idx],
        ...update,
        lastChecked: 'Agora',
      };
      this.save();
    }
  }

  // --- Credits & Transactions ---
  getCredits(): UserCredits {
    return this.data.credits;
  }

  reserveCredits(amount: number, description: string, jobId?: string): boolean {
    if (this.data.credits.remainingCredits < amount) {
      return false;
    }
    this.data.credits.remainingCredits -= amount;
    this.data.credits.usedCredits += amount;
    this.data.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      jobId,
      amount,
      type: 'charge',
      description,
      createdAt: new Date().toISOString(),
    });
    this.save();
    return true;
  }

  refundCredits(amount: number, description: string, jobId?: string) {
    this.data.credits.remainingCredits += amount;
    this.data.credits.usedCredits = Math.max(0, this.data.credits.usedCredits - amount);
    this.data.transactions.unshift({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      jobId,
      amount,
      type: 'refund',
      description,
      createdAt: new Date().toISOString(),
    });
    this.save();
  }

  // --- Library ---
  getLibraryItems(): MediaLibraryItem[] {
    return this.data.libraryItems;
  }

  // --- Affiliate links ---
  getAffiliateLinks(): AffiliateLink[] {
    return this.data.affiliateLinks;
  }

  saveAffiliateLink(link: AffiliateLink): AffiliateLink {
    const idx = this.data.affiliateLinks.findIndex((item) => item.id === link.id);
    if (idx >= 0) this.data.affiliateLinks[idx] = link;
    else this.data.affiliateLinks.unshift(link);
    this.save();
    return link;
  }
}

export const db = new DatabaseStore();
