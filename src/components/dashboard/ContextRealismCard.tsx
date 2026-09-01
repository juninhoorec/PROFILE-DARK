'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GenerationSettings = { keepContext:boolean; preserveProduct:boolean; autoCaptions:boolean; showWatermark:boolean; realismLevel:number; renderQuality:string; visualStyle:string; backgroundScene:string };
export const DEFAULT_GENERATION_SETTINGS:GenerationSettings = {keepContext:true,preserveProduct:true,autoCaptions:true,showWatermark:false,realismLevel:90,renderQuality:'1080p (Full HD)',visualStyle:'Natural',backgroundScene:'Adaptar ao contexto'};

export const ContextRealismCard: React.FC<{value:GenerationSettings;onChange:(value:GenerationSettings)=>void}> = ({value,onChange}) => {
  const update=<K extends keyof GenerationSettings>(key:K,next:GenerationSettings[K])=>onChange({...value,[key]:next});
  const {keepContext,preserveProduct,autoCaptions,showWatermark,realismLevel,renderQuality,visualStyle,backgroundScene}=value;

  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 flex flex-col justify-between h-[360px] shadow-subtle">
      <div>
        {/* Header */}
        <div className="mb-2.5">
          <h3 className="text-xs font-bold text-white tracking-wide">
            4. Contexto e realismo
          </h3>
          <p className="text-[10.5px] text-zinc-400 mt-0.5">
            Defina o nível de fidelidade e o estilo visual do seu vídeo.
          </p>
        </div>

        {/* 2-Column Split: Toggles on Left, Selectors on Right */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column: 4 Toggles */}
          <div className="space-y-2.5">
            {/* Toggle 1: Manter contexto original */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-zinc-200">
                  Manter contexto original
                </div>
                <div className="text-[9.5px] text-zinc-400 leading-tight">
                  Preserva a mensagem e informações principais.
                </div>
              </div>
              <button
                onClick={() => update('keepContext',!keepContext)}
                className={cn(
                  'w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5',
                  keepContext ? 'bg-emerald-500' : 'bg-zinc-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform',
                    keepContext ? 'translate-x-3.5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Toggle 2: Preservar detalhes do produto */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-zinc-200">
                  Preservar detalhes do produto
                </div>
                <div className="text-[9.5px] text-zinc-400 leading-tight">
                  Mantém cores, texturas e características.
                </div>
              </div>
              <button
                onClick={() => update('preserveProduct',!preserveProduct)}
                className={cn(
                  'w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5',
                  preserveProduct ? 'bg-emerald-500' : 'bg-zinc-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform',
                    preserveProduct ? 'translate-x-3.5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Toggle 3: Legendas automáticas */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-zinc-200">
                  Legendas automáticas
                </div>
                <div className="text-[9.5px] text-zinc-400 leading-tight">
                  Planeja legendas junto com o roteiro.
                </div>
              </div>
              <button
                onClick={() => update('autoCaptions',!autoCaptions)}
                className={cn(
                  'w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5',
                  autoCaptions ? 'bg-emerald-500' : 'bg-zinc-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform',
                    autoCaptions ? 'translate-x-3.5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Toggle 4: Mostrar marca d'água */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-zinc-200">
                  Mostrar marca d'água
                </div>
                <div className="text-[9.5px] text-zinc-400 leading-tight">
                  Adiciona marca d'água "PROFILE DARK".
                </div>
              </div>
              <button
                onClick={() => update('showWatermark',!showWatermark)}
                className={cn(
                  'w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5',
                  showWatermark ? 'bg-emerald-500' : 'bg-zinc-700'
                )}
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded-full bg-white transition-transform',
                    showWatermark ? 'translate-x-3.5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Selectors */}
          <div className="space-y-2.5">
            {/* Nível de realismo Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10.5px] font-medium text-zinc-300">
                  Nível de realismo
                </label>
                <span className="text-[10.5px] font-semibold text-brand-400">
                  {realismLevel}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={realismLevel}
                onChange={(e) => update('realismLevel',Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Qualidade do render */}
            <div>
              <label className="text-[10.5px] font-medium text-zinc-400 mb-1 block">
                Qualidade do render
              </label>
              <select
                value={renderQuality}
                onChange={(e) => update('renderQuality',e.target.value)}
                className="w-full py-1.5 px-2 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
              >
                <option>4K (Ultra)</option>
                <option>1080p (Full HD)</option>
                <option>720p (HD)</option>
              </select>
            </div>

            {/* Estilo visual */}
            <div>
              <label className="text-[10.5px] font-medium text-zinc-400 mb-1 block">
                Estilo visual
              </label>
              <select
                value={visualStyle}
                onChange={(e) => update('visualStyle',e.target.value)}
                className="w-full py-1.5 px-2 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
              >
                <option>Natural</option>
                <option>Cinematográfico</option>
                <option>Estúdio Iluminado</option>
                <option>UGC Autêntico</option>
              </select>
            </div>

            {/* Fundo / cenário */}
            <div>
              <label className="text-[10.5px] font-medium text-zinc-400 mb-1 block">
                Fundo / cenário
              </label>
              <select
                value={backgroundScene}
                onChange={(e) => update('backgroundScene',e.target.value)}
                className="w-full py-1.5 px-2 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500"
              >
                <option>Adaptar ao contexto</option>
                <option>Estúdio Minimalista</option>
                <option>Ambiente Externo Natural</option>
                <option>Apartamento Moderno</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
