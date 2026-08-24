'use client';

import React, { useState } from 'react';
import { ChevronRight, Play, Pause, Edit3, Volume2 } from 'lucide-react';
import { Profile } from '@/lib/types';

interface ProfileSettingsCardProps {
  profiles: Profile[];
  selectedProfile: Profile;
  onSelectProfile: (profile: Profile) => void;
  onEditProfile?: (profile: Profile) => void;
}

export const ProfileSettingsCard: React.FC<ProfileSettingsCardProps> = ({
  profiles,
  selectedProfile,
  onSelectProfile,
  onEditProfile,
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [realismVal, setRealismVal] = useState(selectedProfile?.realismScore || 90);

  const toggleVoicePlayback = () => {
    setIsPlayingVoice((prev) => !prev);
    // Simulate voice audio playback stop after 3s
    if (!isPlayingVoice) {
      setTimeout(() => setIsPlayingVoice(false), 3000);
    }
  };

  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 flex flex-col justify-between h-[360px] shadow-subtle">
      <div>
        {/* Header with Selecionar Profile link */}
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-white tracking-wide">
            3. Configurações do Profile
          </h3>
          <button
            onClick={() => onEditProfile?.(selectedProfile)}
            className="text-[11px] font-medium text-zinc-400 hover:text-brand-300 flex items-center gap-0.5 transition-colors"
          >
            <span>Selecionar Profile</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Nome do profile */}
          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
              Nome do profile
            </label>
            <select
              value={selectedProfile?.id}
              onChange={(e) => {
                const found = profiles.find((p) => p.id === e.target.value);
                if (found) onSelectProfile(found);
              }}
              className="w-full py-1.5 px-2.5 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#141418]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nicho */}
          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
              Nicho
            </label>
            <select
              value={selectedProfile?.niche || 'Lifestyle & Beleza'}
              onChange={() => {}}
              className="w-full py-1.5 px-2.5 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option>{selectedProfile?.niche || 'Lifestyle & Beleza'}</option>
              <option>Tecnologia & Automotivo</option>
              <option>Esportes & Fitness</option>
              <option>Skincare & Saúde</option>
            </select>
          </div>

          {/* Personalidade */}
          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
              Personalidade
            </label>
            <select
              value={selectedProfile?.personality || 'Carismática'}
              onChange={() => {}}
              className="w-full py-1.5 px-2.5 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option>{selectedProfile?.personality || 'Carismática'}</option>
              <option>Analítico</option>
              <option>Enérgico</option>
              <option>Sereno</option>
            </select>
          </div>

          {/* Tom de voz */}
          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
              Tom de voz
            </label>
            <select
              value={selectedProfile?.toneOfVoice || 'Acolhedor'}
              onChange={() => {}}
              className="w-full py-1.5 px-2.5 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option>{selectedProfile?.toneOfVoice || 'Acolhedor'}</option>
              <option>Autoridade Técnica</option>
              <option>Descontraído</option>
              <option>Suave</option>
            </select>
          </div>
        </div>

        {/* Realismo & Idioma */}
        <div className="grid grid-cols-2 gap-2.5 mb-2">
          {/* Realismo */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-medium text-zinc-400">
                Realismo
              </label>
              <span className="text-[10px] font-semibold text-brand-400">
                Alto ({realismVal}%)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={realismVal}
              onChange={(e) => setRealismVal(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Idioma */}
          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
              Idioma
            </label>
            <select
              value={selectedProfile?.language || 'Português (BR)'}
              onChange={() => {}}
              className="w-full py-1.5 px-2.5 bg-[#0E0E12] border border-[#24242C] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option>Português (BR)</option>
              <option>English (US)</option>
              <option>Español (ES)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Row: Voz + Aparência */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C1C22]">
        {/* Voz Pill */}
        <div>
          <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
            Voz
          </label>
          <div className="flex items-center justify-between p-1.5 bg-[#0E0E12] border border-[#24242C] rounded-xl">
            <div className="flex items-center gap-1.5">
              <img
                src={selectedProfile?.avatarUrl}
                alt="Voice profile"
                className="w-6 h-6 rounded-full object-cover border border-zinc-700"
              />
              <span className="text-[10.5px] font-medium text-zinc-200 truncate max-w-[70px]">
                {selectedProfile?.voiceName || 'Luna (Natural)'}
              </span>
            </div>
            <button
              onClick={toggleVoicePlayback}
              className="w-5 h-5 rounded-full bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white transition-colors"
            >
              {isPlayingVoice ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Aparência */}
        <div>
          <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
            Aparência
          </label>
          <div className="flex items-center justify-between p-1 bg-[#0E0E12] border border-[#24242C] rounded-xl">
            <img
              src={selectedProfile?.avatarUrl}
              alt="Appearance preview"
              className="w-7 h-7 rounded-lg object-cover border border-zinc-700"
            />
            <button
              onClick={() => onEditProfile?.(selectedProfile)}
              className="px-2.5 py-1 text-[10px] font-semibold text-zinc-300 hover:text-white bg-[#1A1A22] hover:bg-[#252530] border border-[#2E2E3C] rounded-lg transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
