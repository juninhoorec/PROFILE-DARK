'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Lock, Sparkles, Edit3, Camera, Copy, CheckCheck, X } from 'lucide-react';
import { Profile } from '@/lib/types';
import { INITIAL_PROFILES } from '@/lib/constants';
import { CreateProfileModal } from '@/components/modals/CreateProfileModal';
import { RealismEngine } from '@/lib/ai/realism-engine';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPromptProfile, setViewPromptProfile] = useState<Profile | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((d) => {
        if (d.profiles) setProfiles(d.profiles);
      })
      .catch(() => {});
  }, []);

  const handleProfileCreated = (newProfile: Profile) => {
    setProfiles((prev) => [newProfile, ...prev]);
  };

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Profiles Virtuais
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Personagens virtuais hiper-realistas com Character Lock ativo e finalidade comercial definida.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-purple-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar novo Profile</span>
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-3 gap-6">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="bg-[#121216] border border-[#1F1F28] hover:border-brand-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-subtle flex flex-col justify-between"
          >
            <div>
              {/* Profile Card Top */}
              <div className="flex items-start gap-3.5">
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500/40 shadow-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                      {p.realismScore}% Realismo
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-400 font-medium">{p.niche}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{p.dna.suggestedUsernames[0] || '@profile'}</div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-zinc-300 mt-3 line-clamp-2 leading-relaxed">
                {p.bio}
              </p>

              {/* Commercial Goal & CTA */}
              <div className="mt-3 p-3 bg-[#0C0C0F] border border-[#1C1C24] rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-zinc-400">Objetivo Comercial:</span>
                  <span className="text-brand-300 font-semibold uppercase">{p.dna.primaryCommercialGoal}</span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  CTA: <span className="text-zinc-200">&quot;{p.dna.mainCTA}&quot;</span>
                </div>
              </div>

              {/* Character Lock Badges */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1C1C24] text-[10.5px]">
                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Character Lock 100%</span>
                </div>
                <span className="text-zinc-500">6 atributos bloqueados</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setViewPromptProfile(p)}
                className="flex-1 py-1.5 bg-[#181328] hover:bg-[#221B38] border border-brand-500/40 rounded-xl text-xs font-semibold text-brand-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-brand-400" />
                <span>Prompt Gemini/ChatGPT</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Prompt Modal */}
      {viewPromptProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400" />
                <h2 className="text-sm font-bold text-white">
                  Prompt Mestre de Consistência — {viewPromptProfile.name}
                </h2>
              </div>
              <button onClick={() => setViewPromptProfile(null)} className="p-1 text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-zinc-400">
                Utilize este prompt calibrado para gerar novas imagens do personagem no <strong>Google Gemini (Imagen 3)</strong>, <strong>ChatGPT (DALL-E 3)</strong>, <strong>FLUX.1</strong> ou <strong>Midjourney</strong> garantindo identidade facial 100% idêntica.
              </p>

              <div className="p-3.5 bg-[#0C0C10] border border-brand-500/40 rounded-xl text-[11px] font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {viewPromptProfile.dna.imageGenerationPrompt ||
                  RealismEngine.buildMasterImagePrompt(viewPromptProfile.dna).prompt}
              </div>

              <div className="p-3 bg-[#161222] border border-brand-500/30 rounded-xl space-y-1">
                <span className="text-[10.5px] font-bold text-brand-400 uppercase">Negative Prompt (Evitar Inconsistências):</span>
                <p className="text-[10.5px] text-zinc-300 font-mono">
                  {viewPromptProfile.dna.masterNegativePrompt ||
                    RealismEngine.buildMasterImagePrompt(viewPromptProfile.dna).negativePrompt}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
              <button
                onClick={() => setViewPromptProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Fechar
              </button>

              <button
                onClick={() =>
                  handleCopyPrompt(
                    viewPromptProfile.dna.imageGenerationPrompt ||
                      RealismEngine.buildMasterImagePrompt(viewPromptProfile.dna).prompt
                  )
                }
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-1.5 transition-all"
              >
                {copiedPrompt ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>✓ Prompt Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prompt Mestre</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProfileCreated={handleProfileCreated}
      />
    </div>
  );
}
