'use client';

import React, { useState } from 'react';
import { Zap, Bot, Sliders, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function AutopilotPage() {
  const [mode, setMode] = useState<'off' | 'sugestao' | 'aguardar' | 'automatico'>('aguardar');

  const [mix, setMix] = useState({
    atracao: 50,
    relacionamento: 25,
    autoridade: 15,
    vendaDireta: 10,
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-400" />
            Autopilot Comercial & AI Pipeline
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Automação inteligente de criação e postagens orientada a equilíbrio de audiência e conversão.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Modes: 6 cols */}
        <div className="col-span-6 space-y-4 bg-[#121216] border border-[#1F1F28] rounded-2xl p-6 shadow-subtle">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Modo de Operação do Autopilot
          </h2>

          <div className="space-y-2.5">
            {[
              {
                id: 'off',
                title: 'OFF (Desativado)',
                desc: 'Nenhuma ação automática ou sugestão proativa.',
              },
              {
                id: 'sugestao',
                title: 'SUGESTÃO',
                desc: 'A IA apenas sugere pautas e criativos sem gerar vídeos.',
              },
              {
                id: 'aguardar',
                title: 'GERAR E AGUARDAR APROVAÇÃO (Recomendado)',
                desc: 'A IA gera roteiro e prévia, mas aguarda seu clique para render final e publicação.',
              },
              {
                id: 'automatico',
                title: 'AUTOMÁTICO 100%',
                desc: 'A IA gera, renderiza e publica nos melhores horários de audiência.',
              },
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === m.id
                    ? 'bg-[#1E1730] border-brand-500/50 shadow-purple-glow'
                    : 'bg-[#0C0C0F] border-[#1C1C24] hover:bg-[#141418]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    mode === m.id ? 'border-brand-400 bg-brand-600' : 'border-zinc-600'
                  }`}
                >
                  {mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100">{m.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Mix: 6 cols */}
        <div className="col-span-6 space-y-4 bg-[#121216] border border-[#1F1F28] rounded-2xl p-6 shadow-subtle">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Sales Mix — Distribuição de Conteúdo</span>
            <span className="text-brand-400 font-mono text-[11px]">Total: 100%</span>
          </h2>

          <p className="text-xs text-zinc-400">
            Evite transformar seu Profile em um catálogo repetitivo. O Autopilot equilibra alcance, autoridade e oferta.
          </p>

          <div className="space-y-3.5 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Atração / Topo de Funil</span>
                <span className="text-brand-400 font-bold">{mix.atracao}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={mix.atracao}
                onChange={(e) => setMix({ ...mix, atracao: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Relacionamento & Rotina</span>
                <span className="text-brand-400 font-bold">{mix.relacionamento}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={mix.relacionamento}
                onChange={(e) => setMix({ ...mix, relacionamento: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Autoridade & Prova Social</span>
                <span className="text-brand-400 font-bold">{mix.autoridade}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={mix.autoridade}
                onChange={(e) => setMix({ ...mix, autoridade: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">Venda Direta & Oferta</span>
                <span className="text-emerald-400 font-bold">{mix.vendaDireta}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={mix.vendaDireta}
                onChange={(e) => setMix({ ...mix, vendaDireta: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E1E26]">
            <button
              onClick={() => alert('Configurações do Autopilot salvas com sucesso!')}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow transition-all"
            >
              Salvar Estratégia do Autopilot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
