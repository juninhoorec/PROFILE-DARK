'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { INITIAL_LIBRARY_ITEMS } from '@/lib/constants';

export default function CalendarioPage() {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-400" />
            Calendário Editorial & Agendamento
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Planejamento semanal de publicações e distribuição de conteúdo comercial.
          </p>
        </div>

        <button
          onClick={() => alert('Agendador de publicação aberto.')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-purple-glow transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agendar Publicação</span>
        </button>
      </div>

      {/* Weekly Schedule Board */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, idx) => {
          const item = INITIAL_LIBRARY_ITEMS[idx % INITIAL_LIBRARY_ITEMS.length];

          return (
            <div
              key={day}
              className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-3.5 space-y-3 min-h-[380px] flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-zinc-200 border-b border-[#1E1E26] pb-2 flex items-center justify-between">
                  <span>{day}</span>
                  <span className="text-[10px] text-brand-400 font-mono">18:00</span>
                </div>

                {item && (
                  <div className="mt-3 p-2.5 bg-[#0C0C0F] border border-[#1E1E26] rounded-xl space-y-2 group">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full aspect-video rounded-lg object-cover"
                    />
                    <div className="text-[11px] font-bold text-zinc-200 line-clamp-2 leading-tight">
                      {item.title}
                    </div>
                    <div className="text-[9.5px] text-zinc-400">
                      Profile: {item.profileName}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-emerald-400 pt-1 border-t border-[#181820]">
                      <span>● Agendado</span>
                      <span>Reels / TikTok</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => alert(`Adicionar publicação para ${day}`)}
                className="w-full py-1.5 bg-[#181820] hover:bg-[#20202C] border border-[#242430] rounded-xl text-[10.5px] text-zinc-400 hover:text-zinc-200 font-medium transition-colors text-center"
              >
                + Adicionar slot
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
