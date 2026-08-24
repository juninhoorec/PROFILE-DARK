import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/db';
import { Product } from '@/lib/types';

export async function GET() {
  const products = db.getProducts();
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, brand, category, description, imageUrl, price, offer, buyUrl, productLock, dna } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
    }

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      brand: brand || 'Marca Própria',
      category: category || 'Geral',
      description: description || 'Produto de alta qualidade.',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      price,
      offer,
      buyUrl,
      productLock: productLock || {
        logo: true,
        color: true,
        shape: true,
        material: true,
        packaging: true,
        text: true,
        details: true,
      },
      dna: dna || {
        name,
        brand: brand || 'Marca',
        category: category || 'Geral',
        keyFeatures: ['Acabamento refinado', 'Alta durabilidade'],
        colors: ['Neutro'],
        shape: 'Design ergonômico',
        packagingDetails: 'Embalagem original premium',
        mainBenefits: ['Praticidade imediata', 'Alta eficiência'],
        problemSolved: 'Falta de uma solução robusta no dia a dia',
        desireExploited: 'Conforto e qualidade premium',
        price,
        specialOffer: offer,
        checkoutUrl: buyUrl,
        targetAudience: 'Consumidores exigentes',
        commonObjections: ['Custo-benefício'],
        primaryDifferentiator: 'Design exclusivo e tecnologia de ponta',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveProduct(newProduct);
    return NextResponse.json({ product: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
