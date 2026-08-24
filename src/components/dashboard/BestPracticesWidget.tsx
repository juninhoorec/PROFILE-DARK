'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const BestPracticesWidget: React.FC = () => {
  const practices = [
    'Forneça referências visuais claras',
    'Descreva o público e o objetivo',
    'Escolha o estilo certo para sua marca',
    'Revise o roteiro antes de renderizar',
  ];

  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 shadow-subtle">
      <h3 className="text-xs font-bold text-white tracking-wide mb-3">
        Boas práticas
      </h3>

      <div className="space-y-2.5">
        {practices.map((text, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-zinc-300 leading-snug">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
