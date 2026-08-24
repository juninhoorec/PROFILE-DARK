'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, TrendingUp, DollarSign, Gem, PlusCircle, Check } from 'lucide-react';
import { DarkRadarConcept } from '@/lib/types';
import { DARK_RADAR_CONCEPTS } from '@/lib/constants';

export default function DarkRadarPage() {
  const [concepts, setConcepts] = useState<DarkRadarConcept[]>(DARK_RADAR_CONCEPTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = [
    'Todos',
    '🔥 Aquecendo',
    '🚀 Crescendo',
    '💎 Pouco explorado',
    '💰 Alta monetização',
    'Animais',
    'Mulheres 50+',
    'Profissões',
    'Gastronomia',
    'Humor',
    'Tecnologia',
    'Beleza',
  ];

  const filteredConcepts =
    selectedCategory === 'Todos'
      ? concepts
      : concepts.filter(
          (c) => c.category === selectedCategory || c.tag === selectedCategory
        );

  const handleCreateFromConcept = (concept: DarkRadarConcept) => {
    fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: concept.suggestedProfileDNA?.name || concept.name,
        avatarUrl: concept.imageUrl,
        niche: concept.category,
        personality: concept.suggestedProfileDNA?.toneOfVoice || 'Carismático',
        toneOfVoice: concept.suggestedProfileDNA?.toneOfVoice || 'Acolhedor',
        voiceName: 'Voz Nativa IA',
        realismScore: concept.opportunityScore,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        alert(`Profile "${concept.name}" criado com sucesso a partir do Dark Radar!`);
      })
      .catch((e) => alert(e.message));
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Dark Radar — Oportunidades Comerciais
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Conceitos de perfis virtuais validados por IA com alta demanda de audiência e oportunidades claras de monetização.
          </p>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-purple-glow'
                : 'bg-[#141418] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Concepts Grid */}
      <div className="grid grid-cols-3 gap-6">
        {filteredConcepts.map((c) => (
          <div
            key={c.id}
            className="bg-[#121216] border border-[#1F1F28] hover:border-brand-500/40 rounded-2xl overflow-hidden group transition-all flex flex-col justify-between shadow-subtle"
          >
            <div>
              {/* Media Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  {c.tag}
                </div>
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#141220]/90 backdrop-blur-sm text-xs font-extrabold text-brand-300 border border-brand-500/40">
                  Score: {c.opportunityScore}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
                    {c.name}
                  </h3>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Categoria: <strong className="text-zinc-200">{c.category}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px] p-2.5 bg-[#0C0C0F] border border-[#1C1C24] rounded-xl">
                  <div>
                    <span className="text-zinc-500 block">Potencial Comercial:</span>
                    <span className="text-emerald-400 font-bold">{c.commercialPotential}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Complexidade:</span>
                    <span className="text-zinc-300 font-semibold">{c.productionComplexity}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Produtos Possíveis:</span>
                  <div className="flex flex-wrap gap-1">
                    {c.possibleProducts.map((prod, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="p-4 pt-0">
              <button
                onClick={() => handleCreateFromConcept(c)}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center justify-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Criar esse Profile</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
