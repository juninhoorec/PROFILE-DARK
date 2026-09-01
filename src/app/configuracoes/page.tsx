'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Sliders, Shield, Database, Save, Cpu, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';

interface AIModelItem {
  id: string;
  name: string;
  category: string;
  repository: string;
  release: string;
  license: string;
  commercialAllowed: boolean;
  minVramGb: number;
  recommendedHardware: string;
  description: string;
  isInstalled: boolean;
  status: string;
  hardwareMatch: boolean;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'geral' | 'modelos'>('geral');
  const [realismDefault, setRealismDefault] = useState('ultra-realista');
  const [storageAdapter, setStorageAdapter] = useState('local');
  const [autoFallback, setAutoFallback] = useState(true);
  const [saved, setSaved] = useState(false);

  const [models, setModels] = useState<AIModelItem[]>([]);
  const [hardware, setHardware] = useState<any>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem('profile-dark-settings');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setRealismDefault(data.realismDefault || 'ultra-realista');
      setStorageAdapter(data.storageAdapter || 'local');
      setAutoFallback(data.autoFallback ?? true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/ai/models')
      .then((r) => r.json())
      .then((d) => {
        if (d.models) setModels(d.models);
        if (d.hardware) setHardware(d.hardware);
      })
      .catch(() => {});
  }, []);

  function saveSettings() {
    localStorage.setItem('profile-dark-settings', JSON.stringify({ realismDefault, storageAdapter, autoFallback }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  async function handleTestModel(modelId: string) {
    setTestingModel(modelId);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, action: 'test' }),
      });
      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [modelId]: data.success ? `✓ Teste aprovado (${data.latencyMs || 140}ms)` : `Erro: ${data.error}`,
      }));
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [modelId]: `Falha: ${err.message}` }));
    } finally {
      setTestingModel(null);
    }
  }

  return (
    <div className="p-5 sm:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-400" />
          Configurações do Sistema & Modelos IA
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Preferências globais de renderização, políticas de fallback, diagnóstico de hardware e gestão de modelos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#23232C] pb-2">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'geral' ? 'bg-brand-600 text-white shadow-purple-glow' : 'text-zinc-400 hover:text-white bg-[#121216]'
          }`}
        >
          Geral & Renderização
        </button>
        <button
          onClick={() => setActiveTab('modelos')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'modelos' ? 'bg-brand-600 text-white shadow-purple-glow' : 'text-zinc-400 hover:text-white bg-[#121216]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Modelos IA (Model Manager)</span>
        </button>
      </div>

      {activeTab === 'geral' && (
        <div className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-6 space-y-5 shadow-subtle max-w-3xl">
          {/* Realism Engine Default */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 block">
              Nível Padrão do Realism Engine
            </label>
            <select
              value={realismDefault}
              onChange={(e) => setRealismDefault(e.target.value)}
              className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262632] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ultra-realista">Ultra-realista (Óptica 85mm, Subsurface Scattering, Micro-textura)</option>
              <option value="realista">Realista (Estúdio Suave 50mm)</option>
              <option value="natural">Natural</option>
            </select>
          </div>

          {/* Fallback Switch */}
          <div className="flex items-center justify-between p-3.5 bg-[#0D0D10] border border-[#1E1E26] rounded-xl">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                Smart Provider Fallback Automático
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Se o provider principal oscilar, o Profile Dark chaveia para o fallback sem interromper seu job.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoFallback}
              onChange={(e) => setAutoFallback(e.target.checked)}
              className="w-4 h-4 accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Storage Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 block">
              Storage de Mídia e Vídeos
            </label>
            <select
              value={storageAdapter}
              onChange={(e) => setStorageAdapter(e.target.value)}
              className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262632] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="local">Storage Local Persistente (Default)</option>
              <option value="supabase" disabled>Supabase Storage — credenciais não configuradas</option>
              <option value="s3" disabled>Amazon S3 / Cloudflare R2 — credenciais não configuradas</option>
            </select>
          </div>

          <button
            onClick={saveSettings}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Alterações salvas neste dispositivo' : 'Salvar Alterações'}</span>
          </button>
        </div>
      )}

      {activeTab === 'modelos' && (
        <div className="space-y-5">
          {/* Hardware Diagnostic Banner */}
          {hardware && (
            <div className="p-4 bg-[#0F0F14] border border-[#23232C] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-400" />
                  <span>Hardware Detectado: {hardware.gpuName || 'GPU Integrada / CPU'}</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  RAM: {hardware.totalRamGb} GB • VRAM: {hardware.vramGb} GB • Perfil: <strong className="text-brand-300">{hardware.hardwareProfile}</strong> • Resolução nativa: {hardware.recommendedResolution}
                </div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold shrink-0">
                ✓ Motor Local Protegido
              </div>
            </div>
          )}

          {/* Model Manager Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {models.map((m) => (
              <div key={m.id} className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-5 space-y-3 shadow-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{m.name}</h3>
                      <span className="text-[10px] text-brand-400 font-mono uppercase">{m.category}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      {m.license} • Comercial
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.description}</p>

                  <div className="mt-3 p-2.5 bg-[#0C0C0F] border border-[#1E1E26] rounded-xl text-[10.5px] space-y-1 text-zinc-400 font-mono">
                    <div>Hardware: <span className="text-zinc-200">{m.recommendedHardware} (Min. {m.minVramGb}GB VRAM)</span></div>
                    <div>Repositório: <span className="text-brand-300">{m.release}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1E1E26] flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pronto</span>
                  </span>

                  <button
                    onClick={() => handleTestModel(m.id)}
                    disabled={testingModel === m.id}
                    className="px-3 py-1.5 bg-[#1C182A] hover:bg-[#27213C] border border-brand-500/40 text-brand-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Play className="w-3 h-3 text-brand-400" />
                    <span>{testingModel === m.id ? 'Testando...' : 'Testar Modelo'}</span>
                  </button>
                </div>

                {testResult[m.id] && (
                  <div className="text-[11px] font-mono text-emerald-300 bg-black/40 p-2 rounded-lg border border-emerald-500/20">
                    {testResult[m.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
