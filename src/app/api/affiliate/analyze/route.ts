import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/storage/db';
import { UniversalProductResolver, buildProductDNA } from '@/lib/affiliate/resolver';
import { ProfileProductMatcher } from '@/lib/affiliate/profile-product-matcher';
import { AffiliateLink, Product } from '@/lib/types';

const requestSchema = z.object({ url: z.string().url().max(4096) });

export async function POST(request: Request) {
  try {
    const { url } = requestSchema.parse(await request.json());
    const resolved = await UniversalProductResolver.resolve(url);
    if (resolved.resolutionSource === 'manual_required') return NextResponse.json({ resolved, requiresManualInput: true });
    const dna = buildProductDNA(resolved.data);
    dna.checkoutUrl = resolved.affiliateUrl;
    const now = new Date().toISOString();
    const existingLink=db.getAffiliateLinks().find(item=>item.affiliateUrl===resolved.affiliateUrl);
    const existingProduct=existingLink?.productId?db.getProductById(existingLink.productId):undefined;
    const product: Product = {
      id: existingProduct?.id || `prod_${crypto.randomUUID()}`, name: resolved.data.name!, brand: resolved.data.brand || 'Não informada',
      category: resolved.data.category || 'Produto', description: resolved.data.description || 'Sem descrição publicada.',
      imageUrl: resolved.data.imageUrl, price: [resolved.data.currency, resolved.data.price].filter(Boolean).join(' '), buyUrl: resolved.affiliateUrl,
      productLock: { logo: true, color: true, shape: true, material: true, packaging: true, text: true, details: true }, dna, createdAt: existingProduct?.createdAt || now, updatedAt: now,
    };
    db.saveProduct(product);
    const affiliateLink: AffiliateLink = {
      id: existingLink?.id || `aff_${crypto.randomUUID()}`, productId: product.id, affiliateUrl: resolved.affiliateUrl, resolvedUrl: resolved.resolvedUrl,
      platform: resolved.platform, trackingPreserved: true, resolutionSource: resolved.resolutionSource, createdAt: existingLink?.createdAt || now,
    };
    db.saveAffiliateLink(affiliateLink);
    return NextResponse.json({ resolved, product, affiliateLink, productDNA: dna, matches: ProfileProductMatcher.suggest(dna) }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Cole um link completo e válido.' : error instanceof Error ? error.message : 'Não conseguimos analisar este produto.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
