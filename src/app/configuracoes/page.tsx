'use client';

import React, { useState } from 'react';
import { Settings, Sliders, Shield, Database, Save } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [realismDefault, setRealismDefault] = useState('ultra-realista');
  const [storageAdapter, setStorageAdapter] = useState('local');
  const [autoFallback, setAutoFallback] = useState(true);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" />
          Configurações do Sistema
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Preferências globais de renderização, políticas de fallback e armazenamento de arquivos.
        </p>
      </div>

      <div className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-6 space-y-5 shadow-subtle max-w-3xl">
        {/* Realism Engine Default */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200 block">
            Nível Padrão do Realism Engine
          </label>
          <select
            value={realismDefault}
            onChange={(e) => setRealismDefault(e.target.value)}
            className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262632] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="ultra-realista">Ultra-realista (Óptica 85mm, Subsurface Scattering, Micro-textura)</option>
            <option value="realista">Realista (Estúdio Suave 50mm)</option>
            <option value="natural">Natural</option>
          </select>
        </div>

        {/* Fallback Switch */}
        <div className="flex items-center justify-between p-3.5 bg-[#0D0D10] border border-[#1E1E26] rounded-xl">
          <div>
            <div className="text-xs font-semibold text-zinc-200">
              Smart Provider Fallback Automático
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Se o provider principal oscilar, o Profile Dark chaveia para o fallback sem interromper seu job.
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoFallback}
            onChange={(e) => setAutoFallback(e.target.checked)}
            className="w-4 h-4 accent-purple-600 cursor-pointer"
          />
        </div>

        {/* Storage Provider */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-200 block">
            Storage de Mídia e Vídeos
          </label>
          <select
            value={storageAdapter}
            onChange={(e) => setStorageAdapter(e.target.value)}
            className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262632] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="local">Storage Local Persistente (Default)</option>
            <option value="supabase">Supabase Storage</option>
            <option value="s3">Amazon S3 / Cloudflare R2</option>
          </select>
        </div>

        <button
          onClick={() => alert('Configurações salvas com sucesso!')}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>
    </div>
  );
}
