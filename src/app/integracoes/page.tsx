'use client';

import React, { useEffect, useState } from 'react';
import { Plug, Zap, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck } from 'lucide-react';

export default function IntegracoesPage() {
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<Record<string, any>>({});

  const [providers, setProviders] = useState([
    {
      id: 'llm',
      name: 'LLM & Context Engine (Texto / Roteiros)',
      provider: 'Nenhum',
      configured: false,
      status: 'Não configurado',
    },
    {
      id: 'image',
      name: 'Gerador de Imagens & Rosto Hiper-Realista',
      provider: 'Nenhum',
      configured: false,
      status: 'Não configurado',
    },
    {
      id: 'voice',
      name: 'Síntese de Voz & TTS (Áudio Natural)',
      provider: 'Nenhum',
      configured: false,
      status: 'Não configurado',
    },
    {
      id: 'video',
      name: 'Renderizador de Vídeo & Lip-Sync',
      provider: 'Nenhum',
      configured: false,
      status: 'Não configurado',
    },
  ]);

  useEffect(() => {
    fetch('/api/health').then((response) => response.json()).then((data) => {
      if (!data.details) return;
      setProviders((items) => items.map((item) => {
        const health = data.details.find((detail: any) => detail.service === item.id);
        return health ? { ...item, provider:data.activeProviders?.[item.id]||'Nenhum', configured: health.isConfigured, status: health.status === 'operational' ? 'Operacional' : health.status === 'degraded' ? 'Aguardando teste' : 'Não configurado' } : item;
      }));
    }).catch(() => {});
  }, []);

  const handleTest = async (serviceId: string) => {
    setTestingService(serviceId);
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId }),
      });
      const data = await res.json();
      setTestOutput((prev) => ({ ...prev, [serviceId]: data.result }));
    } catch (e: any) {
      setTestOutput((prev) => ({ ...prev, [serviceId]: { success: false, error: e.message } }));
    } finally {
      setTestingService(null);
    }
  };

  return (
    <div className="p-5 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Plug className="w-5 h-5 text-brand-400" />
          Integrações de IA & Smart Provider Router
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Diagnóstico de credenciais e testes controlados. Um serviço só fica verde depois de responder com sucesso real.
        </p>
      </div>

      {/* Providers list */}
      <div className="space-y-4">
        {providers.map((p) => {
          const isTesting = testingService === p.id;
          const output = testOutput[p.id];
          const operational=p.status==='Operacional';

          return (
            <div
              key={p.id}
              className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-5 space-y-3 shadow-subtle"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{p.name}</h3>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Provider ativo: <strong className="text-brand-300">{p.provider}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${operational ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                    {operational ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{p.status}</span>
                  </span>

                  <button
                    onClick={() => handleTest(p.id)}
                    disabled={isTesting}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-purple-glow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Testar Integração</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Output preview */}
              {output && (
                <div className="p-3 bg-[#0C0C0F] border border-[#1C1C24] rounded-xl text-xs space-y-1 font-mono text-[11px]">
                  <div className={output.success ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                    {output.success ? `✓ Teste real concluído (${output.latencyMs}ms)` : `Configuração necessária: ${output.userFriendlyError || output.error}`}
                  </div>
                  {output.success && <div className="text-zinc-400">
                    Motor: {output.provider} • Modelo: {output.model} • Cobrança: bloqueada
                  </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
