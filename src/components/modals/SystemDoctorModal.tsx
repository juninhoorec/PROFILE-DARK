'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProviderHealth } from '@/lib/types';
import { INITIAL_PROVIDER_HEALTH } from '@/lib/constants';

interface DiagnosticReport {
  overallStatus: 'healthy' | 'warning' | 'critical';
  summary: string;
  providers: ProviderHealth[];
  issuesFound: string[];
  recommendedActions: string[];
  canRunGeneration: boolean;
  canRun3SecondTest: boolean;
}

interface SystemDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDoctorModal: React.FC<SystemDoctorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<DiagnosticReport>({
    overallStatus: 'critical',
    summary: 'Carregando diagnóstico real do sistema.',
    providers: INITIAL_PROVIDER_HEALTH,
    issuesFound: [],
    recommendedActions: ['Aguarde a leitura das integrações.'],
    canRunGeneration: false,
    canRun3SecondTest: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDiagnosis = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.diagnosis) {
        setReport(data.diagnosis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnosis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                AI System Doctor — Auto-Diagnóstico
              </h2>
              <p className="text-xs text-zinc-400">
                Diagnóstico sob demanda de disponibilidade, configuração e respostas já validadas.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              report.overallStatus === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {report.overallStatus==='healthy'?<CheckCircle2 className="w-5 h-5 flex-shrink-0" />:<AlertTriangle className="w-5 h-5 flex-shrink-0"/>}
            <div>
              <div className="font-bold text-xs">
                {report.overallStatus === 'healthy' ? 'Sistema 100% Operacional' : 'Avisos Encontrados'}
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">{report.summary}</div>
            </div>
          </div>

          {/* Providers Health Table */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider block">
              Status Individual dos Providers
            </span>
            <div className="bg-[#0C0C0F] border border-[#1E1E26] rounded-xl divide-y divide-[#181820] overflow-hidden">
              {report.providers.map((p) => {
                const operational=p.status==='operational';
                return (
                <div key={p.service} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${operational?'bg-emerald-400':'bg-amber-400'}`} />
                    <div>
                      <div className="font-semibold text-zinc-200">{p.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        Latência: {p.latencyMs}ms • Taxa de sucesso: {p.successRate}%
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${operational?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-300'}`}>
                    {operational?'Operacional':p.status==='degraded'?'Aguardando validação':'Não configurado'}
                  </span>
                </div>
              )})}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-1.5 p-3.5 bg-[#14141A] border border-[#23232C] rounded-xl">
            <span className="text-[10.5px] font-bold text-brand-400 uppercase tracking-wider block">
              Orientações do AI Doctor:
            </span>
            <ul className="space-y-1 text-zinc-300 text-[11px]">
              {report.recommendedActions.map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-brand-400">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
          <button
            onClick={fetchDiagnosis}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-[#181820] hover:bg-[#22222E] border border-[#272734] rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Reavaliar Sistema</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
