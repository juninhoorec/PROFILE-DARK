'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export const NeedHelpWidget: React.FC = () => {
  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 shadow-subtle">
      <h3 className="text-xs font-bold text-white tracking-wide mb-1">
        Precisa de ajuda?
      </h3>
      <p className="text-[11px] text-zinc-400 leading-snug mb-3">
        Acesse nossa central de ajuda ou fale com o suporte.
      </p>

      <button
        onClick={() => alert('Central de Ajuda e Suporte PROFILE DARK aberta.')}
        className="w-full py-2 px-3 bg-[#181820] hover:bg-[#20202C] border border-[#272734] rounded-xl text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-colors"
      >
        <span>Abrir central de ajuda</span>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
      </button>
    </div>
  );
};
