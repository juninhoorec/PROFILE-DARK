import { lookup } from 'node:dns/promises';
import { AffiliatePlatform, ProductDNA } from '@/lib/types';

export interface ResolvedAffiliateProduct {
  affiliateUrl: string;
  resolvedUrl?: string;
  platform: AffiliatePlatform;
  trackingPreserved: true;
  resolutionSource: 'structured_data' | 'open_graph' | 'html' | 'manual_required';
  data: { name?: string; brand?: string; category?: string; description?: string; imageUrl?: string; price?: string; currency?: string };
  warnings: string[];
}

const PLATFORM_HOSTS: Array<[RegExp, AffiliatePlatform]> = [
  [/shopee/i, 'shopee'], [/mercadolivre|mercadolibre/i, 'mercado_livre'], [/shein/i, 'shein'],
  [/tiktok/i, 'tiktok_shop'], [/amazon|amzn/i, 'amazon'], [/aliexpress/i, 'aliexpress'],
  [/hotmart/i, 'hotmart'], [/kiwify/i, 'kiwify'], [/eduzz/i, 'eduzz'], [/monetizze/i, 'monetizze'], [/braip/i, 'braip'],
];

function platformFor(hostname: string): AffiliatePlatform {
  return PLATFORM_HOSTS.find(([pattern]) => pattern.test(hostname))?.[1] || 'universal';
}

function isPrivateIp(address: string) {
  return /^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|fc|fd|fe80)/i.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address);
}

async function assertSafeUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use um link http ou https válido.');
  if (url.username || url.password || ['localhost', '0.0.0.0'].includes(url.hostname)) throw new Error('Este endereço não pode ser analisado.');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw new Error('Este endereço não pode ser analisado.');
}

const decode = (value?: string) => value?.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  return decode(patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean));
}

function jsonLd(html: string): Record<string, any> | undefined {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] || [parsed];
      const product = nodes.find((node: any) => String(node?.['@type']).toLowerCase().includes('product'));
      if (product) return product;
    } catch { /* invalid publisher JSON-LD; continue with permitted metadata */ }
  }
}

export class UniversalProductResolver {
  static async resolve(rawUrl: string): Promise<ResolvedAffiliateProduct> {
    let url: URL;
    try { url = new URL(rawUrl.trim()); } catch { throw new Error('Cole um link completo e válido.'); }
    await assertSafeUrl(url);
    const base = { affiliateUrl: rawUrl.trim(), platform: platformFor(url.hostname), trackingPreserved: true as const };
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(9000), headers: { 'User-Agent': 'ProfileDarkProductResolver/1.0 (+public-metadata)' } });
      if (!response.ok) throw new Error(`Fonte respondeu ${response.status}`);
      const type = response.headers.get('content-type') || '';
      if (!type.includes('text/html')) throw new Error('A fonte não retornou uma página pública.');
      const html = (await response.text()).slice(0, 1_500_000);
      const structured = jsonLd(html);
      const offers = structured?.offers;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      const image = Array.isArray(structured?.image) ? structured.image[0] : structured?.image;
      const data = {
        name: decode(structured?.name) || meta(html, 'og:title') || meta(html, 'twitter:title'),
        brand: decode(typeof structured?.brand === 'object' ? structured.brand.name : structured?.brand),
        category: decode(structured?.category),
        description: decode(structured?.description) || meta(html, 'og:description') || meta(html, 'description'),
        imageUrl: image || meta(html, 'og:image') || meta(html, 'twitter:image'),
        price: offer?.price ? String(offer.price) : meta(html, 'product:price:amount'),
        currency: offer?.priceCurrency || meta(html, 'product:price:currency'),
      };
      if (!data.name) throw new Error('A página não publicou metadados suficientes.');
      return { ...base, resolvedUrl: response.url, resolutionSource: structured ? 'structured_data' : 'open_graph', data, warnings: [] };
    } catch (error) {
      return { ...base, resolutionSource: 'manual_required', data: {}, warnings: [`Não foi possível ler os dados públicos: ${error instanceof Error ? error.message : 'fonte indisponível'}. Complete as informações manualmente.`] };
    }
  }
}

export function buildProductDNA(data: ResolvedAffiliateProduct['data']): ProductDNA {
  const category = data.category || 'Produto';
  return {
    name: data.name || '', brand: data.brand || 'Não informada', category,
    keyFeatures: [], colors: [], shape: 'A confirmar pelas referências', packagingDetails: 'A confirmar pelas referências',
    mainBenefits: data.description ? [data.description.slice(0, 180)] : [], problemSolved: 'A confirmar na revisão',
    desireExploited: `Melhor experiência com ${category.toLowerCase()}`, price: data.price, checkoutUrl: undefined,
    targetAudience: `Pessoas interessadas em ${category.toLowerCase()}`, commonObjections: ['Preço', 'Confiança no produto'],
    primaryDifferentiator: 'A confirmar com dados oficiais do produto',
  };
}
