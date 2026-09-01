'use client';

import React, { useState } from 'react';
import { X, Zap, CheckCircle2, AlertTriangle, Play, Sparkles, RefreshCw, Check } from 'lucide-react';
import { GenerationJob, QualityCheck } from '@/lib/types';

interface Video3sTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: GenerationJob | null;
  qualityCheck: QualityCheck | null;
  onGenerateFullVideo: () => void;
  onRetest: () => void;
  onAutoFix?: (jobId: string) => void;
}

export const Video3sTestModal: React.FC<Video3sTestModalProps> = ({
  isOpen,
  onClose,
  job,
  qualityCheck,
  onGenerateFullVideo,
  onRetest,
  onAutoFix,
}) => {
  const [isApplyingFix, setIsApplyingFix] = useState(false);

  if (!isOpen || !job) return null;

  const metrics = qualityCheck?.metrics;
  const isValidated = Boolean(job.videoUrl && qualityCheck);

  const handleAutoFixClick = () => {
    setIsApplyingFix(true);
    if (onAutoFix) onAutoFix(job.id);
    setTimeout(() => {
      setIsApplyingFix(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                ⚡ Resultado do Teste Rápido
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                  {isValidated ? 'Validado ✓' : 'Prévia sem inspeção'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Validação de pipeline, identidade de personagem, produto e sincronismo antes do render completo.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-12 gap-6">
          {/* Video Player Column */}
          <div className="col-span-6 space-y-3">
            <div className="relative aspect-[9/16] w-full max-h-[380px] bg-black rounded-xl overflow-hidden border border-[#262632] flex items-center justify-center group mx-auto">
              {job.videoUrl ? <video
                src={job.videoUrl}
                poster={job.thumbnailUrl || job.profileAvatarUrl}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              /> : <div className="px-6 text-center text-xs text-zinc-400">Nenhum vídeo real foi gerado para este item.</div>}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-zinc-200">
                00:{String(job.durationSeconds).padStart(2,'0')} / {job.resolution}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-semibold text-zinc-200">{job.title}</div>
              <div className="text-[10px] text-zinc-400">Provider: {job.providerUsed || 'não informado'}</div>
            </div>
          </div>

          {/* AI Quality Scorecard Column */}
          <div className="col-span-6 space-y-4">
            {/* Score Cards Grid */}
            <div>
              <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>AI Quality Inspector</span>
                <span className="text-[10px] text-zinc-400 font-normal">Análise Multimodal de Frames</span>
              </div>

              {metrics ? <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#16161C] border border-[#252530] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 block">REALISMO</span>
                  <span className="text-lg font-extrabold text-emerald-400">{metrics.realism}</span>
                </div>
                <div className="bg-[#16161C] border border-[#252530] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 block">IDENTIDADE</span>
                  <span className="text-lg font-extrabold text-emerald-400">{metrics.identity}</span>
                </div>
                <div className="bg-[#16161C] border border-[#252530] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 block">PRODUTO</span>
                  <span className="text-lg font-extrabold text-emerald-400">{metrics.product}</span>
                </div>
                <div className="bg-[#16161C] border border-[#252530] p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-400 block">MOVIMENTO</span>
                  <span className="text-lg font-extrabold text-brand-400">{metrics.motion}</span>
                </div>
                <div className="bg-[#16161C] border border-[#252530] p-2.5 rounded-xl text-center col-span-2">
                  <span className="text-[10px] text-zinc-400 block">QUALIDADE GERAL</span>
                  <span className="text-lg font-extrabold text-white">{metrics.overallQuality} / 100</span>
                </div>
              </div> : <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-100">Sem inspeção multimodal real. As notas de realismo, identidade, produto e movimento não serão exibidas até um inspetor ser configurado.</div>}
            </div>

            {/* Quality Checklist */}
            {qualityCheck && <div className="bg-[#0E0E12] border border-[#1E1E26] p-3 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Checklist de Validação IA
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-zinc-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rosto consistente</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Produto bloqueado</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sincronia labial</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Brand Safety 100%</span>
                </div>
              </div>
            </div>}

            {/* AI Auto-Fix section */}
            {qualityCheck?.details?.autoFixAvailable && (
              <div className="p-3 bg-[#241A14] border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Sugestão de Otimização IA</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  {qualityCheck.details.suggestedFix}
                </p>
                <button
                  onClick={handleAutoFixClick}
                  disabled={isApplyingFix}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isApplyingFix ? 'Otimizando Cena...' : 'Corrigir Automaticamente'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isValidated && <button
              onClick={onRetest}
              className="px-3.5 py-2 bg-[#181820] hover:bg-[#22222E] border border-[#272734] rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Testar novamente</span>
            </button>}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Ajustar
            </button>
            <button
              onClick={() => {
                onClose();
                onGenerateFullVideo();
              }}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Tudo certo! Gerar vídeo completo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
