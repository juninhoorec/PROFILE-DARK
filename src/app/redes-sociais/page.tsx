'use client';

import React from 'react';
import { Share2, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function RedesSociaisPage() {
  const networks = [
    {
      id: 'instagram',
      name: 'Instagram Professional',
      handle: '@lunastar.oficial',
      status: 'Conectado via Meta Graph API',
      active: true,
      icon: '📸',
    },
    {
      id: 'tiktok',
      name: 'TikTok for Creators',
      handle: '@lunastar.dark',
      status: 'Conectado via TikTok API v2',
      active: true,
      icon: '🎵',
    },
    {
      id: 'youtube',
      name: 'YouTube Shorts',
      handle: 'Canal Luna Star',
      status: 'Desconectado',
      active: false,
      icon: '▶️',
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-brand-400" />
          Conexões de Redes Sociais
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Integrações diretas via OAuth e APIs oficiais. O Profile Dark nunca solicita senhas pessoais.
        </p>
      </div>

      {/* Security notice */}
      <div className="p-4 bg-[#141824] border border-blue-500/30 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300">
          <strong className="text-white block mb-0.5">Segurança & Conformidade:</strong>
          Todas as publicações e análises de métricas utilizam tokens autenticados oficiais com escopo limitado de criador.
        </div>
      </div>

      {/* Networks Grid */}
      <div className="grid grid-cols-3 gap-6">
        {networks.map((net) => (
          <div
            key={net.id}
            className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-5 space-y-4 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="text-2xl">{net.icon}</div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    net.active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {net.active ? 'Ativo' : 'Desconectado'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-3">{net.name}</h3>
              <div className="text-xs text-brand-300 font-medium">{net.handle}</div>
              <p className="text-[11px] text-zinc-400 mt-1">{net.status}</p>
            </div>

            <button
              onClick={() => alert(`Gerenciando autenticação de ${net.name}`)}
              className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                net.active
                  ? 'bg-[#181820] hover:bg-[#22222E] border border-[#272734] text-zinc-200'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-purple-glow'
              }`}
            >
              {net.active ? 'Gerenciar Conexão' : 'Conectar via OAuth 2.0'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
