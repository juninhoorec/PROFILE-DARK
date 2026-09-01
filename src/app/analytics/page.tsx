'use client';

import React from 'react';
import { BarChart3, Link2, ShieldCheck } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = ['Visualizações Totais', 'Taxa de Retenção (3s)', 'Engajamento Médio', 'Conversões em Vendas'];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          Analytics & Desempenho Real
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Métricas consolidadas de alcance, retenção de vídeo e conversão de produtos por personagem.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-5">
        {metrics.map((label) => {
          return (
            <div
              key={label}
              className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-4 space-y-2 shadow-subtle"
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold">{label}</span>
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="text-2xl font-extrabold text-zinc-600">—</div>
              <div className="text-[11px] text-zinc-500 font-semibold">Sem fonte de dados conectada</div>
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-[#121216] border border-[#292933] rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold uppercase tracking-wider">
          <Link2 className="w-4 h-4 text-brand-400" />
          <span>Conecte suas contas para começar</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Métricas e recomendações do AI Learning Loop só serão exibidas quando vierem de uma API social, integração de afiliados ou tracking real.
        </p>
      </div>
    </div>
  );
}
