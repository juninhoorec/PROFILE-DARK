'use client';

import React, { useEffect, useState } from 'react';
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
  const [testMessage,setTestMessage]=useState('');

  const [services, setServices] = useState([
    { id: 'llm', label: 'LLM (IA)', icon: Cpu, status: 'Não configurado', ok: false },
    { id: 'voice', label: 'Voz (TTS)', icon: Mic, status: 'Não configurado', ok: false },
    { id: 'talking_head', label: 'Talking Head', icon: UserCheck, status: 'Não configurado', ok: false },
    { id: 'render', label: 'Render', icon: Clapperboard, status: 'Não configurado', ok: false },
    { id: 'storage', label: 'Storage local', icon: HardDrive, status: 'Saudável', ok: true },
  ]);

  const loadHealth = async () => {
    const response = await fetch('/api/health');
    const data = await response.json();
    if (!data.details) return;
    setServices((items) => items.map((item) => {
      const health = data.details.find((detail: ProviderHealth) => detail.service === item.id);
      if (!health) return item;
      return { ...item, ok: health.status === 'operational', status: health.status === 'operational' ? 'Operacional' : health.status === 'degraded' ? 'Aguardando teste' : 'Não configurado' };
    }));
  };

  useEffect(() => { void loadHealth().catch(() => {}); }, []);

  const handleTest = async (serviceId: string) => {
    setTestingService(serviceId);
    setTestMessage('');
    try {
      if (onTestProvider) {
        await onTestProvider(serviceId);
      } else {
        const response=await fetch('/api/providers/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: serviceId }),
        });
        const data=await response.json();
        setTestMessage(response.ok?`${serviceId}: teste concluído.`:data.result?.userFriendlyError||data.error||`${serviceId}: integração indisponível.`);
      }
      await loadHealth();
    } catch (e) {
      setTestMessage(e instanceof Error?e.message:'Falha ao testar a integração.');
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
        {services.every((service) => service.ok) ? 'Todos os sistemas operando' : 'Existem integrações que precisam de configuração'}
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
                  <span className={`text-[10.5px] font-medium flex items-center gap-1 ${s.ok ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {s.status}
                    <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
      {testMessage&&<div role="status" className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-[10px] leading-4 text-amber-100">{testMessage}</div>}
    </div>
  );
};
