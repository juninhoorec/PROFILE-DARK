import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { db } from '@/lib/storage/db';
import type { Product, Profile } from '@/lib/types';
import type { SocialCenterState, SocialMediaAsset, SocialPlatform, SocialPost, SocialTrendSnapshot } from './types';
import { COMMERCE_PRODUCT_LINKS } from './product-catalog';

const ROOT = path.join(process.cwd(), 'video e imagem do perfil');
const STATE_FILE = path.join(process.cwd(), 'data', 'social-center.json');
const PLATFORMS: SocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'shopee', 'mercado_livre'];

const PLATFORM_RULES: Record<SocialPlatform, { hours: string[]; hashtags: number; notes: string[] }> = {
  instagram: { hours: ['12:15', '19:30'], hashtags: 5, notes: ['Hook visual no primeiro segundo', 'Legenda curta com palavra-chave', 'Responder comentários cedo'] },
  tiktok: { hours: ['18:45', '21:10'], hashtags: 4, notes: ['Contexto imediato', 'Texto pesquisável na legenda', 'Final que estimula replay'] },
  youtube: { hours: ['12:00', '20:00'], hashtags: 3, notes: ['Título pesquisável', 'Promessa entregue sem enrolação', 'Retenção acima de curtidas'] },
  shopee: { hours: ['10:30', '20:30'], hashtags: 4, notes: ['Benefício antes da oferta', 'Produto visível em uso', 'CTA direto para conferir detalhes'] },
  mercado_livre: { hours: ['09:30', '18:30'], hashtags: 0, notes: ['Título objetivo', 'Atributos completos', 'Descrição que antecipa dúvidas'] },
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hash = (value: string) => createHash('sha1').update(value).digest('hex').slice(0, 16);

function defaultTrends(): SocialTrendSnapshot {
  const refreshed = new Date();
  return {
    refreshedAt: refreshed.toISOString(),
    nextRefreshAt: new Date(refreshed.getTime() + 5 * 60 * 60_000).toISOString(),
    cadenceHours: 5,
    source: 'baseline',
    platformSignals: Object.fromEntries(PLATFORMS.map((platform) => [platform, {
      peakHours: PLATFORM_RULES[platform].hours,
      recommendedHashtagCount: PLATFORM_RULES[platform].hashtags,
      notes: PLATFORM_RULES[platform].notes,
    }])) as SocialTrendSnapshot['platformSignals'],
  };
}

function loadState(): SocialCenterState {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as SocialCenterState;
    if (parsed?.version === 1 && Array.isArray(parsed.posts)) return parsed;
  } catch { /* first run */ }
  return { version: 1, posts: [], trends: defaultTrends() };
}

function saveState(state: SocialCenterState) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const temporary = `${STATE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(temporary, STATE_FILE);
}

function defaultMediaProductLinks(assets: SocialMediaAsset[]) {
  const result: Record<string, string> = {};
  for (const asset of assets) {
    const key = normalize(`${asset.folder} ${asset.fileName}`);
    const product = COMMERCE_PRODUCT_LINKS.find((candidate) => candidate.keywords.some((keyword) => key.includes(normalize(keyword))));
    if (product) result[asset.id] = product.id;
  }
  const exactPairs: Record<string, string> = {
    'Prompt_Gemini_—_Vó_Zélia_Por.mp4': 'shopee_3B6tfafx0v',
    'grok-video-ab8cd352-834f-46dc-ad85-1cc8b68e54cf.mp4': 'shopee_5ArzdKKBBT',
    'grok-video-b900009f-2e1a-4dc8-b121-b85969325ea3.mp4': 'shopee_3qMc2u6zDM',
  };
  for (const asset of assets) if (exactPairs[asset.fileName]) result[asset.id] = exactPairs[asset.fileName];
  return result;
}

function purchasePlacement(platform: SocialPlatform): SocialPost['purchasePlacement'] {
  return platform === 'instagram' || platform === 'tiktok' ? 'pinned_comment' : 'description';
}

function matchProfile(folder: string, profiles: Profile[]) {
  const folderKey = normalize(folder);
  const renamedProfiles: Record<string, string> = { 'pastor clau': 'padre paulo' };
  const renamed = renamedProfiles[folderKey];
  if (renamed) {
    const profile = profiles.find((candidate) => normalize(candidate.name) === renamed);
    if (profile) return profile;
  }
  const exact = profiles.find((profile) => normalize(profile.name) === folderKey);
  if (exact) return exact;
  return profiles
    .map((profile) => {
      const profileTokens = new Set(normalize(profile.name).split(' '));
      const folderTokens = normalize(folder).split(' ');
      const score = folderTokens.filter((token) => profileTokens.has(token)).length / Math.max(folderTokens.length, profileTokens.size);
      return { profile, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.score >= 0.5
    ? profiles.map((profile) => ({ profile, score: normalize(folder).split(' ').filter((token) => new Set(normalize(profile.name).split(' ')).has(token)).length / Math.max(normalize(folder).split(' ').length, normalize(profile.name).split(' ').length) })).sort((a, b) => b.score - a.score)[0].profile
    : undefined;
}

export function scanProfileMedia(): SocialMediaAsset[] {
  if (!fs.existsSync(ROOT)) return [];
  const profiles = db.getProfiles();
  return fs.readdirSync(ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((folder) => {
    const profile = matchProfile(folder.name, profiles);
    const directory = path.join(ROOT, folder.name);
    const walk = (current: string): string[] => fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(current, entry.name)) : path.join(current, entry.name));
    return walk(directory).flatMap((filePath) => {
      const entryName = path.basename(filePath);
      const extension = path.extname(entryName).toLowerCase();
      const kind = ['.mp4', '.mov', '.webm', '.m4v'].includes(extension) ? 'video' : ['.jpg', '.jpeg', '.png', '.webp'].includes(extension) ? 'image' : undefined;
      if (!kind) return [];
      const stat = fs.statSync(filePath);
      const relativePath = path.relative(directory, filePath);
      const relativeFolder = path.dirname(relativePath) === '.' ? 'Geral' : path.dirname(relativePath);
      return [{
        id: `media_${hash(`${folder.name}/${relativePath}`)}`,
        profileId: profile?.id,
        profileName: profile?.name,
        folder: folder.name,
        relativeFolder,
        fileName: entryName,
        kind,
        url: `/api/social/media?folder=${encodeURIComponent(folder.name)}&file=${encodeURIComponent(relativePath)}`,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      } satisfies SocialMediaAsset];
    });
  });
}

function chooseProduct(profile: Profile, products: Product[]) {
  const profileTokens = normalize(`${profile.niche} ${profile.dna.subNiche} ${profile.dna.targetAudience}`).split(' ').filter((value) => value.length > 3);
  const bestMatch = products
    .map((product) => ({ product, score: profileTokens.filter((token) => normalize(`${product.name} ${product.category} ${product.description}`).includes(token)).length }))
    .sort((a, b) => b.score - a.score)[0];
  return bestMatch && bestMatch.score > 0 ? bestMatch.product : undefined;
}

function hashtagPool(profile: Profile, product?: Product) {
  const cleanTags = [profile.niche, profile.dna.subNiche, product?.category, product?.brand, product?.name]
    .filter(Boolean)
    .flatMap((value) => String(value).split(/[&,/|]+/))
    .map((value) => `#${normalize(value).replace(/\s+/g, '')}`)
    .filter((value) => value.length > 2);
  return Array.from(new Set([...cleanTags, '#dicadodia', '#achadinhos', '#reviewhonesto', '#custobeneficio']));
}

function captionFor(profile: Profile, platform: SocialPlatform, objective: SocialPost['objective'], product?: Product) {
  const productName = product?.name.replace(/\|.*$/, '').trim();
  if (product && objective === 'conversao') {
    const benefit = product.dna.mainBenefits[0] || product.dna.problemSolved || 'praticidade no dia a dia';
    const offer = product.offer || product.price;
    const cta = platform === 'mercado_livre' ? 'Confira medidas, atributos e disponibilidade no anúncio.' : 'Confira os detalhes no link antes que a condição mude.';
    return `${profile.name} analisou ${productName}: ${benefit}. ${offer ? `${offer}. ` : ''}${cta}`;
  }
  const hooks: Record<SocialPost['objective'], string> = {
    alcance: `Você já reparou nisso? ${profile.name} mostra um detalhe que quase todo mundo ignora.`,
    relacionamento: `Uma dica rápida e honesta de ${profile.name} para facilitar sua rotina.`,
    autoridade: `${profile.name} explica o que realmente importa, sem promessa fácil e sem enrolação.`,
    conversao: `Antes de comprar, veja a análise de ${profile.name} e escolha com mais segurança.`,
  };
  return hooks[objective];
}

function dateAt(dayOffset: number, time: string) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function generateFourteenDayPlan(profileId?: string) {
  const state = loadState();
  const assets = scanProfileMedia();
  state.mediaProductLinks = { ...defaultMediaProductLinks(assets), ...(state.mediaProductLinks || {}) };
  const profiles = db.getProfiles().filter((profile) => !profileId || profile.id === profileId);
  const products = db.getProducts();
  const objectives: SocialPost['objective'][] = ['alcance', 'relacionamento', 'autoridade', 'conversao'];
  const created: SocialPost[] = [];

  for (const profile of profiles) {
    const profileAssets = assets.filter((asset) => asset.profileId === profile.id);
    if (!profileAssets.length) continue;
    const product = chooseProduct(profile, products);
    for (let day = 0; day < 14; day += 1) {
      const platform = PLATFORMS[day % PLATFORMS.length];
      const objective = objectives[day % objectives.length];
      const media = profileAssets[day % profileAssets.length];
      const linkedProduct = COMMERCE_PRODUCT_LINKS.find((item) => item.id === state.mediaProductLinks?.[media.id]);
      const hashtags = platform === 'mercado_livre' ? [] : hashtagPool(profile, objective === 'conversao' ? product : undefined).slice(0, PLATFORM_RULES[platform].hashtags);
      created.push({
        id: `post_${randomUUID()}`,
        profileId: profile.id,
        profileName: profile.name,
        productId: objective === 'conversao' ? product?.id : undefined,
        productName: objective === 'conversao' ? product?.name : undefined,
        shoppingUrl: linkedProduct?.url,
        purchasePlacement: linkedProduct ? purchasePlacement(platform) : undefined,
        purchaseText: linkedProduct ? `Onde comprar ${linkedProduct.name || 'este produto'}: ${linkedProduct.url}` : undefined,
        platform,
        accountIds: [],
        mediaId: media.id,
        scheduledAt: dateAt(day, PLATFORM_RULES[platform].hours[day % PLATFORM_RULES[platform].hours.length]),
        caption: captionFor(profile, platform, objective, objective === 'conversao' ? product : undefined),
        hashtags,
        objective,
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
    }
  }
  const profileIds = new Set(profiles.map((profile) => profile.id));
  state.posts = [...state.posts.filter((post) => !profileIds.has(post.profileId) || !['draft', 'approved'].includes(post.status)), ...created].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  state.lastMediaScanAt = new Date().toISOString();
  saveState(state);
  return created;
}

export function scheduleMedia(input: { profileId: string; mediaId: string; platform: 'instagram' | 'tiktok' | 'shopee'; accountIds: string[]; scheduledAt: string; caption?: string }) {
  const state = loadState();
  const media = scanProfileMedia().find((item) => item.id === input.mediaId && item.profileId === input.profileId);
  const profile = db.getProfileById(input.profileId);
  if (!media || !profile) throw new Error('Mídia ou perfil não encontrado.');
  if (Date.parse(input.scheduledAt) <= Date.now()) throw new Error('Escolha uma data e horário futuros.');
  const accounts = (state.accounts || []).filter((account) => input.accountIds.includes(account.id) && account.platform === input.platform && account.status === 'connected');
  if (input.accountIds.length && accounts.length !== input.accountIds.length) throw new Error('Uma das contas selecionadas não está conectada.');
  const post: SocialPost = {
    id: `post_${randomUUID()}`,
    profileId: profile.id,
    profileName: profile.name,
    platform: input.platform,
    accountIds: input.accountIds,
    mediaId: media.id,
    scheduledAt: input.scheduledAt,
    caption: input.caption?.trim() || captionFor(profile, input.platform, 'relacionamento'),
    hashtags: hashtagPool(profile).slice(0, PLATFORM_RULES[input.platform].hashtags),
    objective: 'relacionamento',
    status: input.accountIds.length ? 'approved' : 'draft',
    createdAt: new Date().toISOString(),
  };
  state.posts.push(post);
  state.posts.sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  saveState(state);
  return post;
}

export function refreshSocialIntelligence(force = false) {
  const state = loadState();
  if (!force && Date.parse(state.trends.nextRefreshAt) > Date.now()) return state.trends;
  state.trends = defaultTrends();
  // Quando tokens oficiais e IDs de posts existirem, este ponto agrega as
  // métricas reais. Sem conexão, o PD não inventa tendências ou números.
  saveState(state);
  return state.trends;
}

export function getSocialDashboard() {
  const state = loadState();
  const media = scanProfileMedia();
  state.mediaProductLinks = { ...defaultMediaProductLinks(media), ...(state.mediaProductLinks || {}) };
  saveState(state);
  const trends = refreshSocialIntelligence();
  return {
    profiles: db.getProfiles(),
    products: db.getProducts(),
    commerceProducts: COMMERCE_PRODUCT_LINKS,
    mediaProductLinks: state.mediaProductLinks,
    media,
    posts: state.posts,
    accounts: state.accounts || [],
    trends,
    unmappedFolders: Array.from(new Set(media.filter((asset) => !asset.profileId).map((asset) => asset.folder))),
    connections: PLATFORMS.map((platform) => ({ platform, connected: (state.accounts || []).some((account) => account.platform === platform && account.status === 'connected'), accountCount: (state.accounts || []).filter((account) => account.platform === platform && account.status === 'connected').length, mode: platform === 'shopee' ? 'integracao_oficial_necessaria' : 'oauth_necessario' })),
  };
}

export function updatePost(id: string, update: Partial<Pick<SocialPost, 'caption' | 'hashtags' | 'scheduledAt' | 'status' | 'productId' | 'productName'>>) {
  const state = loadState();
  const index = state.posts.findIndex((post) => post.id === id);
  if (index < 0) return undefined;
  state.posts[index] = { ...state.posts[index], ...update };
  saveState(state);
  return state.posts[index];
}

export function associateMediaProduct(mediaId: string, productLinkId?: string) {
  const state = loadState();
  state.mediaProductLinks ||= {};
  if (productLinkId) state.mediaProductLinks[mediaId] = productLinkId;
  else delete state.mediaProductLinks[mediaId];
  for (const post of state.posts.filter((item) => item.mediaId === mediaId)) {
    const product = COMMERCE_PRODUCT_LINKS.find((item) => item.id === productLinkId);
    post.shoppingUrl = product?.url;
    post.purchasePlacement = product ? purchasePlacement(post.platform) : undefined;
    post.purchaseText = product ? `Onde comprar ${product.name || 'este produto'}: ${product.url}` : undefined;
  }
  saveState(state);
  return state.mediaProductLinks;
}

export function getMediaFile(folder: string, fileName: string) {
  const safeFolder = path.basename(folder);
  const safeFile = path.basename(fileName);
  const file = path.resolve(ROOT, safeFolder, safeFile);
  const root = path.resolve(ROOT) + path.sep;
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return undefined;
  return file;
}
