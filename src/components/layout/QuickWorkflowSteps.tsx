'use client';

import React from 'react';
import { Target, User, Link as LinkIcon, Sliders, Wand2, Film, Download } from 'lucide-react';

export const QuickWorkflowSteps: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Escolher objetivo',
      desc: 'Defina o objetivo do conteúdo que deseja criar.',
      icon: Target,
    },
    {
      number: 2,
      title: 'Criar ou selecionar Profile',
      desc: 'Escolha um profile ou crie um novo com sua identidade.',
      icon: User,
    },
    {
      number: 3,
      title: 'Adicionar referência',
      desc: 'Cole um link ou envie uma referência de até 50 MB.',
      icon: LinkIcon,
    },
    {
      number: 4,
      title: 'Definir contexto e estilo',
      desc: 'Informe detalhes, tom, cenário e estilo visual.',
      icon: Sliders,
    },
    {
      number: 5,
      title: 'Gerar',
      desc: 'Provedores validados criam roteiro, voz e estrutura.',
      icon: Wand2,
    },
    {
      number: 6,
      title: 'Renderizar',
      desc: 'Render real somente com integração operacional.',
      icon: Film,
    },
    {
      number: 7,
      title: 'Baixar',
      desc: 'Visualize, baixe e compartilhe onde quiser.',
      icon: Download,
    },
  ];

  return (
    <div className="bg-[#101013] border border-[#1E1E24] rounded-2xl p-5 shadow-subtle mb-6">
      {/* Title & subtitle */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-wide">
            Comece aqui
          </h2>
          <span className="text-[11px] text-zinc-500 font-normal">• Fluxo rápido</span>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          Siga o passo a passo para transformar qualquer conteúdo em vídeos profissionais.
        </p>
      </div>

      {/* 7 Steps with connecting line */}
      <div className="relative grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Dotted connecting line */}
        <div className="hidden xl:block absolute top-5 left-12 right-12 h-[1px] border-t border-dashed border-[#2E2E38] z-0" />

        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.number} className="relative z-10 flex flex-col items-center text-center px-1 group cursor-pointer">
              {/* Step Circle */}
              <div className="w-10 h-10 rounded-full bg-[#18181E] border border-[#2B2B36] group-hover:border-brand-500/60 group-hover:bg-[#201830] flex items-center justify-center mb-2.5 transition-all shadow-sm">
                <Icon className="w-4 h-4 text-brand-400 group-hover:text-brand-300 transition-colors" />
              </div>

              {/* Step Title with number */}
              <div className="text-[11px] font-semibold text-zinc-200 group-hover:text-white leading-snug mb-1">
                <span className="text-brand-400 mr-1">{s.number}</span>
                {s.title}
              </div>

              {/* Step Description */}
              <div className="text-[9.5px] text-zinc-400 leading-tight line-clamp-2">
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
