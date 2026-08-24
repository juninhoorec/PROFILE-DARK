'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Eye, Play, DollarSign, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Visualizações Totais', value: '1.428.900', change: '+34.2%', icon: Eye, positive: true },
    { label: 'Taxa de Retenção (3s)', value: '88.4%', change: '+5.1%', icon: Play, positive: true },
    { label: 'Engajamento Médio', value: '9.6%', change: '+1.8%', icon: Users, positive: true },
    { label: 'Conversões em Vendas', value: '412', change: '+22.0%', icon: DollarSign, positive: true },
  ];

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
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-4 space-y-2 shadow-subtle"
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold">{m.label}</span>
                <Icon className="w-4 h-4 text-brand-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">{m.value}</div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{m.change} este mês</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Performance Insight Banner */}
      <div className="p-5 bg-[#171328] border border-brand-500/40 rounded-2xl space-y-2 shadow-purple-glow">
        <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4 text-amber-400" />
          <span>AI Learning Loop — Descoberta de Padrão Criativo</span>
        </div>
        <p className="text-xs text-zinc-200 leading-relaxed">
          Vídeos onde a <strong>Luna Star</strong> apresenta o produto <strong>Essence Noir</strong> nos primeiros 4 segundos apresentaram <strong>34% maior retenção</strong> e <strong>+48% cliques no CTA</strong>.
        </p>
      </div>
    </div>
  );
}
