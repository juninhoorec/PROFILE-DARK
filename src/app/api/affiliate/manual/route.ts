import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/storage/db';
import { buildProductDNA } from '@/lib/affiliate/resolver';
import { ProfileProductMatcher } from '@/lib/affiliate/profile-product-matcher';
import { AffiliateLink, AffiliatePlatform, Product } from '@/lib/types';

const schema = z.object({
  affiliateUrl: z.string().url().max(4096),
  name: z.string().trim().min(3, 'Informe o nome completo do produto.').max(240),
  brand: z.string().trim().max(120).optional(),
  category: z.string().trim().min(2, 'Informe uma categoria.').max(120),
  description: z.string().trim().min(20, 'Descreva o produto com pelo menos 20 caracteres.').max(3000),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
  price: z.string().trim().max(80).optional(),
});

function detectPlatform(rawUrl: string): AffiliatePlatform {
  const host = new URL(rawUrl).hostname.toLowerCase();
  if (host.includes('shopee')) return 'shopee';
  if (host.includes('mercadolivre') || host.includes('mercadolibre')) return 'mercado_livre';
  if (host.includes('shein')) return 'shein';
  if (host.includes('tiktok')) return 'tiktok_shop';
  if (host.includes('amazon') || host.includes('amzn')) return 'amazon';
  if (host.includes('aliexpress')) return 'aliexpress';
  if (host.includes('hotmart')) return 'hotmart';
  if (host.includes('kiwify')) return 'kiwify';
  if (host.includes('eduzz')) return 'eduzz';
  if (host.includes('monetizze')) return 'monetizze';
  if (host.includes('braip')) return 'braip';
  return 'universal';
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const dna = buildProductDNA(input);
    dna.checkoutUrl = input.affiliateUrl;
    dna.keyFeatures = ['Informações cadastradas e revisáveis pelo usuário'];
    dna.primaryDifferentiator = 'A confirmar com as referências oficiais do produto';
    const now = new Date().toISOString();
    const existingLink=db.getAffiliateLinks().find(item=>item.affiliateUrl===input.affiliateUrl);
    const existingProduct=existingLink?.productId?db.getProductById(existingLink.productId):undefined;
    const product: Product = {
      id:existingProduct?.id || `prod_${crypto.randomUUID()}`, name:input.name, brand:input.brand || 'Não informada', category:input.category,
      description:input.description, imageUrl:input.imageUrl || undefined, price:input.price || undefined, buyUrl:input.affiliateUrl,
      productLock:{logo:true,color:true,shape:true,material:true,packaging:true,text:true,details:true}, dna, createdAt:existingProduct?.createdAt || now, updatedAt:now,
    };
    db.saveProduct(product);
    const affiliateLink: AffiliateLink = {
      id:existingLink?.id || `aff_${crypto.randomUUID()}`, productId:product.id, affiliateUrl:input.affiliateUrl,
      platform:detectPlatform(input.affiliateUrl), trackingPreserved:true, resolutionSource:'manual_required', createdAt:existingLink?.createdAt || now,
    };
    db.saveAffiliateLink(affiliateLink);
    return NextResponse.json({
      resolved:{ affiliateUrl:input.affiliateUrl, platform:affiliateLink.platform, trackingPreserved:true, resolutionSource:'manual_required', data:input, warnings:[] },
      product, affiliateLink, productDNA:dna, matches:ProfileProductMatcher.suggest(dna), requiresManualInput:false,
    }, { status:201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : 'Não foi possível salvar o produto.';
    return NextResponse.json({ error:message }, { status:400 });
  }
}
