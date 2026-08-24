'use client';

import React from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { PromptEnhanceResult } from '@/lib/ai/prompt-enhancer';

interface PromptEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enhanceResult: PromptEnhanceResult | null;
  onApplyEnhanced: (enhanced: string) => void;
}

export const PromptEnhancerModal: React.FC<PromptEnhancerModalProps> = ({
  isOpen,
  onClose,
  enhanceResult,
  onApplyEnhanced,
}) => {
  if (!isOpen || !enhanceResult) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Otimizador de Prompt com IA
              </h2>
              <p className="text-xs text-zinc-400">
                A IA adicionou contexto de iluminação, enquadramento, consistência e conversão.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diff Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Enhancements Badges */}
          <div className="flex flex-wrap gap-2">
            {enhanceResult.addedContext.map((c, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[#181528] border border-brand-500/30 text-brand-300 text-[10.5px] font-semibold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                {c}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Prompt Original
              </span>
              <div className="p-3.5 bg-[#0D0D10] border border-[#202028] rounded-xl text-xs text-zinc-300 min-h-[180px] whitespace-pre-wrap leading-relaxed">
                {enhanceResult.originalPrompt || '(Sem prompt inicial - criado do zero pela IA)'}
              </div>
            </div>

            {/* Enhanced */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Prompt Otimizado (Cinematográfico)
              </span>
              <div className="p-3.5 bg-[#141220] border border-brand-500/40 rounded-xl text-xs text-zinc-100 min-h-[180px] whitespace-pre-wrap leading-relaxed shadow-card-glow font-mono text-[11.5px]">
                {enhanceResult.enhancedPrompt}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onApplyEnhanced(enhanceResult.enhancedPrompt);
              onClose();
            }}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Usar Prompt Otimizado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
