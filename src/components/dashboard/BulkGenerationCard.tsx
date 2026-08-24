'use client';

import React, { useState } from 'react';
import { Sparkles, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkGenerationCardProps {
  onTriggerBulk: (quantity: number, format: 'reels' | 'shorts' | 'tiktok', variations: string[]) => void;
  isGenerating?: boolean;
}

export const BulkGenerationCard: React.FC<BulkGenerationCardProps> = ({
  onTriggerBulk,
  isGenerating = false,
}) => {
  const [quantity, setQuantity] = useState<number>(10);
  const [format, setFormat] = useState<'reels' | 'shorts' | 'tiktok'>('reels');
  const [selectedVariations, setSelectedVariations] = useState<string[]>(['hook']);

  const toggleVariation = (v: string) => {
    setSelectedVariations((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const handleGenerate = () => {
    onTriggerBulk(quantity, format, selectedVariations);
  };

  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 flex flex-col justify-between h-[360px] shadow-subtle">
      <div>
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-xs font-bold text-white tracking-wide">
            2. Geração em massa
          </h3>
          <p className="text-[10.5px] text-zinc-400 mt-0.5">
            Gere múltiplos vídeos a partir do mesmo conteúdo ou objeto.
          </p>
        </div>

        {/* Quantidade de vídeos */}
        <div className="mb-3">
          <label className="text-[11px] font-medium text-zinc-300 mb-1.5 block">
            Quantidade de vídeos
          </label>
          <div className="flex items-center gap-2">
            {[5, 10, 20].map((num) => (
              <button
                key={num}
                onClick={() => setQuantity(num)}
                className={cn(
                  'flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  quantity === num
                    ? 'bg-brand-600 text-white shadow-purple-glow'
                    : 'bg-[#17171C] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Formatos */}
        <div className="mb-3">
          <label className="text-[11px] font-medium text-zinc-300 mb-1.5 block">
            Formatos
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormat('reels')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all',
                format === 'reels'
                  ? 'bg-brand-600 text-white font-semibold shadow-purple-glow'
                  : 'bg-[#17171C] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
              )}
            >
              <Smartphone className="w-3 h-3" />
              <span>Reels</span>
            </button>
            <button
              onClick={() => setFormat('shorts')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all',
                format === 'shorts'
                  ? 'bg-brand-600 text-white font-semibold shadow-purple-glow'
                  : 'bg-[#17171C] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
              )}
            >
              <span>Shorts</span>
            </button>
            <button
              onClick={() => setFormat('tiktok')}
              className={cn(
                'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all',
                format === 'tiktok'
                  ? 'bg-brand-600 text-white font-semibold shadow-purple-glow'
                  : 'bg-[#17171C] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
              )}
            >
              <span>TikTok</span>
            </button>
          </div>
        </div>

        {/* Variações */}
        <div className="mb-2">
          <label className="text-[11px] font-medium text-zinc-300 mb-1.5 block">
            Variações
          </label>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'hook', label: 'Hook' },
              { id: 'cta', label: 'CTA' },
              { id: 'cenario', label: 'Cenário' },
              { id: 'angulo', label: 'Ângulo' },
            ].map((v) => {
              const active = selectedVariations.includes(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => toggleVariation(v.id)}
                  className={cn(
                    'flex-1 py-1 px-1 text-[11px] font-medium rounded-lg transition-all',
                    active
                      ? 'bg-[#2A1B4A] text-brand-300 border border-brand-500/40 shadow-sm'
                      : 'bg-[#17171C] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Button & Subnote */}
      <div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-purple-glow transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>{isGenerating ? 'Enfileirando...' : '✨ Gerar vídeos em massa'}</span>
        </button>
        <p className="text-[10px] text-zinc-500 text-center mt-1.5">
          Mais variações, mais alcance. Economize tempo!
        </p>
      </div>
    </div>
  );
};
