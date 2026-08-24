'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

export const QuickTipsWidget: React.FC = () => {
  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 shadow-subtle">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-xs font-bold text-white tracking-wide">
            Dicas rápidas
          </h3>
        </div>
        <button className="text-[10.5px] text-zinc-500 hover:text-brand-300 transition-colors">
          Ver todas
        </button>
      </div>

      <div className="space-y-2.5 text-[11px] text-zinc-300">
        <div className="flex items-start gap-1.5">
          <span className="text-brand-400 font-bold text-xs">✦</span>
          <p className="leading-snug text-zinc-300">
            Use links de páginas públicas para melhores resultados.
          </p>
        </div>

        <div className="flex items-start gap-1.5">
          <span className="text-brand-400 font-bold text-xs">✦</span>
          <p className="leading-snug text-zinc-300">
            Quanto mais contexto, melhor o roteiro.
          </p>
        </div>

        <div className="flex items-start gap-1.5">
          <span className="text-brand-400 font-bold text-xs">✦</span>
          <p className="leading-snug text-zinc-300">
            Ative <strong className="text-white font-semibold">"Preservar detalhes do produto"</strong> para máxima fidelidade.
          </p>
        </div>

        <div className="flex items-start gap-1.5">
          <span className="text-brand-400 font-bold text-xs">✦</span>
          <p className="leading-snug text-zinc-300">
            Prefira 1080p para redes sociais e 4K para anúncios e apresentações.
          </p>
        </div>
      </div>
    </div>
  );
};
