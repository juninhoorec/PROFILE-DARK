'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Smartphone, Check, Layers, Play } from 'lucide-react';
import { Profile, Product } from '@/lib/types';
import { INITIAL_PROFILES, INITIAL_PRODUCTS } from '@/lib/constants';

export default function BulkGenerationPage() {
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState(INITIAL_PROFILES[0].id);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState(INITIAL_PRODUCTS[0].id);

  const [quantity, setQuantity] = useState(10);
  const [format, setFormat] = useState<'reels' | 'shorts' | 'tiktok'>('reels');
  const [isGenerating, setIsGenerating] = useState(false);

  // Variation Matrix
  const [varyOptions, setVaryOptions] = useState({
    hook: true,
    script: true,
    scenario: true,
    cta: true,
    wardrobe: false,
    framing: true,
    copy: true,
    duration: false,
  });

  const [keepOptions, setKeepOptions] = useState({
    profile: true,
    product: true,
    brand: true,
    offer: true,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          productId: selectedProductId,
          quantity,
          format,
        }),
      });
      const data = await res.json();
      alert(`Geração em massa concluída! ${quantity} vídeos enfileirados no Render Center.`);
    } catch (e) {
      console.error(e);
      alert('Erro na geração em massa.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-400" />
          Geração em Massa & Matriz de Variações
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Crie dezenas de ângulos criativos e hipóteses de vendas sem duplicar esforços.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Configurator: 7 Cols */}
        <div className="col-span-7 space-y-5 bg-[#121216] border border-[#1F1F28] rounded-2xl p-6 shadow-subtle">
          {/* Profile & Product Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Profile Base
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262632] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.niche})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Produto / Oferta
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262632] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.brand})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade & Formato */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Quantidade de Variações
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuantity(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      quantity === num
                        ? 'bg-brand-600 text-white shadow-purple-glow'
                        : 'bg-[#181820] text-zinc-400 border border-[#262634] hover:text-zinc-200'
                    }`}
                  >
                    {num} vídeos
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Formato de Saída
              </label>
              <div className="flex items-center gap-2">
                {(['reels', 'shorts', 'tiktok'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      format === fmt
                        ? 'bg-brand-600 text-white shadow-purple-glow'
                        : 'bg-[#181820] text-zinc-400 border border-[#262634] hover:text-zinc-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Variation Matrix Toggles */}
          <div className="space-y-3 pt-2 border-t border-[#1E1E26]">
            <div className="grid grid-cols-2 gap-4">
              {/* O que VARIAR */}
              <div className="p-4 bg-[#0E0E12] border border-[#1E1E26] rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block">
                  O que VARIAR a cada criativo:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(varyOptions).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-zinc-300 capitalize">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setVaryOptions({ ...varyOptions, [key]: e.target.checked })}
                        className="accent-purple-600"
                      />
                      <span>{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* O que MANTER */}
              <div className="p-4 bg-[#0E0E12] border border-[#1E1E26] rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  O que MANTER 100% bloqueado:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(keepOptions).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-zinc-300 capitalize">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setKeepOptions({ ...keepOptions, [key]: e.target.checked })}
                        className="accent-purple-600"
                      />
                      <span>{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isGenerating ? 'Processando Matriz...' : `✨ Gerar ${quantity} Criativos em Massa (${quantity * 80} créditos)`}
            </span>
          </button>
        </div>

        {/* Right Matrix Preview: 5 Cols */}
        <div className="col-span-5 space-y-4 bg-[#121216] border border-[#1F1F28] rounded-2xl p-5 shadow-subtle">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Estrutura da Matriz de Geração
          </h3>

          <div className="p-3.5 bg-[#0C0C0F] border border-[#1E1E26] rounded-xl text-xs space-y-2 font-mono text-[11px]">
            <div className="text-brand-300">
              5 Hooks Diferentes × 2 Cenários × 2 CTAs = {quantity} Criativos Únicos
            </div>
            <div className="text-zinc-400 text-[10.5px]">
              • Ângulo 1: Curiosidade & Quebra de Padrão
              <br />• Ângulo 2: Dor do Consumidor & Solução
              <br />• Ângulo 3: Demonstração e Prova Visual
              <br />• Ângulo 4: UGC Sensorial
              <br />• Ângulo 5: Oferta e Urgência
            </div>
          </div>

          <div className="p-3.5 bg-[#171424] border border-brand-500/30 rounded-xl text-xs text-zinc-300">
            <strong className="text-white block mb-1">Garantia Anti-Spam:</strong>
            A IA não altera apenas uma palavra. Cada criativo possui roteiro, entonação e dinâmica próprios adaptados ao objetivo de vendas.
          </div>
        </div>
      </div>
    </div>
  );
}
