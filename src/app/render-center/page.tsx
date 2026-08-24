'use client';

import React, { useState, useEffect } from 'react';
import { Film, RefreshCw, XCircle, CheckCircle2, AlertCircle, Play, MoreVertical, Layers } from 'lucide-react';
import { GenerationJob } from '@/lib/types';
import { INITIAL_RENDER_JOBS } from '@/lib/constants';
import { getStatusBadge } from '@/lib/utils';

export default function RenderCenterPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>(INITIAL_RENDER_JOBS);
  const [filter, setFilter] = useState<'todos' | 'processando' | 'concluidos' | 'falhas'>('todos');

  useEffect(() => {
    fetch('/api/render-jobs')
      .then((r) => r.json())
      .then((d) => {
        if (d.jobs) setJobs(d.jobs);
      })
      .catch(() => {});
  }, []);

  const handleRetryScene = async (jobId: string, sceneNum: number) => {
    try {
      const res = await fetch(`/api/render-jobs/${jobId}/scene-retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneNumber: sceneNum }),
      });
      const d = await res.json();
      if (d.job) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? d.job : j)));
        alert(`Regeneração da Cena ${sceneNum} iniciada mantendo Profile e Produto bloqueados.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/render-jobs/${jobId}/cancel`, { method: 'POST' });
      const d = await res.json();
      if (d.job) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? d.job : j)));
        alert('Job cancelado e créditos estornados.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'processando') return j.status !== 'concluido' && j.status !== 'falhou' && j.status !== 'cancelado';
    if (filter === 'concluidos') return j.status === 'concluido';
    if (filter === 'falhas') return j.status === 'falhou';
    return true;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-400" />
            Render Center — Fila de Processamento & Cenas
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Acompanhe o pipeline de renderização em tempo real com controle granular por cena.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['todos', 'processando', 'concluidos', 'falhas'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filter === tab
                ? 'bg-brand-600 text-white shadow-purple-glow'
                : 'bg-[#141418] text-zinc-400 border border-[#23232C] hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const badge = getStatusBadge(job.status);

          return (
            <div
              key={job.id}
              className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-5 space-y-4 shadow-subtle"
            >
              {/* Job Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={job.thumbnailUrl || job.profileAvatarUrl}
                    alt={job.title}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{job.title}</h3>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Profile: <strong className="text-zinc-200">{job.profileName}</strong> •{' '}
                      {job.productName ? `Produto: ${job.productName} • ` : ''}
                      Resolução: <span className="uppercase text-brand-300">{job.resolution}</span> • Duração:{' '}
                      {job.durationSeconds}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    <span className={`text-xs font-bold ${badge.text}`}>{badge.label}</span>
                  </div>

                  {job.status !== 'concluido' && job.status !== 'cancelado' && (
                    <button
                      onClick={() => handleCancelJob(job.id)}
                      className="px-3 py-1.5 bg-[#1C1518] hover:bg-[#2A1D22] border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancelar Job</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Pipeline Progress */}
              <div className="p-3.5 bg-[#0C0C0F] border border-[#1C1C24] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                  <span>Pipeline de Execução IA:</span>
                  <span className="text-brand-400">{job.progress}% Concluído</span>
                </div>

                <div className="grid grid-cols-8 gap-2 text-center pt-1">
                  {job.pipeline.map((stage) => {
                    const isDone = stage.status === 'completed';
                    const isRunning = stage.status === 'in_progress';

                    return (
                      <div
                        key={stage.id}
                        className={`p-2 rounded-lg border text-[10.5px] font-medium transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : isRunning
                            ? 'bg-brand-500/20 border-brand-500/50 text-brand-200 animate-pulse'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div className="truncate">{stage.label}</div>
                        <div className="text-[9px] mt-0.5 font-mono">
                          {isDone ? '✓ Pronto' : isRunning ? '● Gerando' : '○ Aguardando'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Scene Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-semibold text-[10.5px]">Regenerar cena específica:</span>
                  {[1, 2, 3].map((sNum) => (
                    <button
                      key={sNum}
                      onClick={() => handleRetryScene(job.id, sNum)}
                      className="px-2 py-1 bg-[#181822] hover:bg-[#242432] border border-[#2B2B3C] rounded-lg text-[10.5px] font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                      Regenerar Cena {sNum}
                    </button>
                  ))}
                </div>

                {job.status === 'concluido' && job.videoUrl && (
                  <a
                    href={job.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-purple-glow flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Assistir Vídeo Final</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
