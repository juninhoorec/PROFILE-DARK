'use client';

import React from 'react';
import { X, Sparkles, Zap, Check, Film, Layers, PlayCircle } from 'lucide-react';
import { CreativePlan, Profile, Product } from '@/lib/types';

interface CreativePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CreativePlan | null;
  profile: Profile | null;
  product?: Product | null;
  onRun3sTest: () => void;
  onApproveAndRender: () => void;
}

export const CreativePlanModal: React.FC<CreativePlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  profile,
  product,
  onRun3sTest,
  onApproveAndRender,
}) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-brand-400" />
              Plano Criativo & Roteiro por Cenas
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Revise a estrutura de cenas e faça um teste rápido de 5 segundos antes do render completo.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Metadata bar */}
          <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#0E0E12] border border-[#1E1E26] rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 block">Personagem</span>
              <span className="text-zinc-200 font-semibold">{profile?.name || 'Luna Star'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Produto</span>
              <span className="text-zinc-200 font-semibold">{product?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Objetivo / Ângulo</span>
              <span className="text-brand-300 font-semibold capitalize">{plan.objective}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Duração Estimada</span>
              <span className="text-zinc-200 font-semibold">{plan.targetDurationSeconds}s · modo gratuito</span>
            </div>
          </div>

          {/* Hook card */}
          <div className="p-3.5 bg-[#171424] border border-brand-500/30 rounded-xl space-y-1">
            <div className="text-[10.5px] font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Hook Inicial (Primeiros 3 segundos)
            </div>
            <p className="text-xs font-semibold text-white">
              "{plan.hook}"
            </p>
          </div>

          {/* Scenes Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Detalhamento de Cenas (Scene-Based Generation)
            </h4>

            {plan.scenes.map((scene) => (
              <div
                key={scene.sceneNumber}
                className="p-3.5 bg-[#14141A] border border-[#23232E] rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 text-[10px] flex items-center justify-center font-mono">
                      {scene.sceneNumber}
                    </span>
                    {scene.title}
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded">
                    {scene.durationSeconds}s
                  </span>
                </div>

                <div className="text-xs text-zinc-300 bg-[#0C0C0F] p-2.5 rounded-lg border border-[#1A1A22] italic">
                  "{scene.narrationScript}"
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-zinc-400 pt-1">
                  <div>
                    <strong className="text-zinc-300">Câmera:</strong> {scene.cameraMovement}
                  </div>
                  <div>
                    <strong className="text-zinc-300">Interação:</strong> {scene.productInteraction}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA & Caption */}
          <div className="p-3.5 bg-[#0E0E12] border border-[#1E1E26] rounded-xl space-y-1 text-xs">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">
              Chamada para Ação (CTA) & Legenda
            </span>
            <p className="text-zinc-200 font-medium">
              {plan.ctaText}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Editar Roteiro
          </button>

          <div className="flex items-center gap-2.5">
            {/* 3-Second Test Button */}
            <button
              onClick={() => {
                onClose();
                onRun3sTest();
              }}
              className="px-4 py-2.5 bg-[#1E1A2C] hover:bg-[#2A243E] border border-brand-500/40 text-brand-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>⚡ Teste gratuito de 5 segundos</span>
            </button>

            {/* Full Render Button */}
            <button
              onClick={() => {
                onClose();
                onApproveAndRender();
              }}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Aprovar e gerar gratuitamente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
