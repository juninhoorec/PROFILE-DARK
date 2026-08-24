'use client';

import React, { useState } from 'react';
import { Cpu, Mic, UserCheck, Clapperboard, HardDrive, Sparkles, CheckCircle2 } from 'lucide-react';
import { ProviderHealth } from '@/lib/types';

interface SystemHealthWidgetProps {
  onOpenSystemDoctor?: () => void;
  onTestProvider?: (service: string) => void;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  onOpenSystemDoctor,
  onTestProvider,
}) => {
  const [testingService, setTestingService] = useState<string | null>(null);

  const services = [
    { id: 'llm', label: 'LLM (IA)', icon: Cpu, status: 'Configurado', ok: true },
    { id: 'voice', label: 'Voz (TTS)', icon: Mic, status: 'Configurado', ok: true },
    { id: 'talking_head', label: 'Talking Head', icon: UserCheck, status: 'Configurado', ok: true },
    { id: 'render', label: 'Render', icon: Clapperboard, status: 'Configurado', ok: true },
    { id: 'storage', label: 'Storage', icon: HardDrive, status: 'Saudável', ok: true, usage: '68% usado' },
  ];

  const handleTest = async (serviceId: string) => {
    setTestingService(serviceId);
    try {
      if (onTestProvider) {
        await onTestProvider(serviceId);
      } else {
        await fetch('/api/providers/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: serviceId }),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setTestingService(null), 800);
    }
  };

  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 shadow-subtle">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-white tracking-wide">
          Saúde do sistema
        </h3>
        <button
          onClick={onOpenSystemDoctor}
          className="text-[10.5px] font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Doctor</span>
        </button>
      </div>
      <div className="text-[10px] text-zinc-400 mb-3">
        Todos os sistemas operando
      </div>

      {/* Services List */}
      <div className="space-y-2.5">
        {services.map((s) => {
          const Icon = s.icon;
          const isTesting = testingService === s.id;

          return (
            <div key={s.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                {/* Service Name & Icon */}
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <Icon className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px]">{s.label}</span>
                </div>

                {/* Status Pill & Test button */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTest(s.id)}
                    disabled={isTesting}
                    className="text-[9.5px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                  >
                    {isTesting ? 'Testando...' : 'Testar'}
                  </button>
                  <span className="text-[10.5px] text-emerald-400 font-medium flex items-center gap-1">
                    {s.status}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </span>
                </div>
              </div>

              {/* Optional Storage usage bar */}
              {s.usage && (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex-1 bg-zinc-800 rounded-full h-1 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '68%' }} />
                  </div>
                  <span className="text-[9.5px] text-zinc-400">{s.usage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
