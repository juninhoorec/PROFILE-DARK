'use client';

import React from 'react';
import { MoreVertical, Eye, Download } from 'lucide-react';
import { GenerationJob } from '@/lib/types';
import { getStatusBadge } from '@/lib/utils';

interface RenderQueueCardProps {
  jobs: GenerationJob[];
  onViewJob: (job: GenerationJob) => void;
  onDownloadJob: (job: GenerationJob) => void;
}

export const RenderQueueCard: React.FC<RenderQueueCardProps> = ({
  jobs,
  onViewJob,
  onDownloadJob,
}) => {
  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 flex flex-col justify-between h-[360px] shadow-subtle overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white tracking-wide">
            5. Fila de renderização
          </h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 text-[10px] font-medium text-zinc-400 pb-1.5 border-b border-[#1E1E24] px-1">
          <div className="col-span-5">Tarefa</div>
          <div className="col-span-3 text-center">Progresso</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#18181E] overflow-y-auto max-h-[265px] pr-1">
          {jobs.length===0&&<div className="flex min-h-[220px] items-center justify-center px-6 text-center text-xs leading-5 text-zinc-500">Nenhum render real na fila. Jobs demonstrativos não são exibidos aqui.</div>}
          {jobs.slice(0, 5).map((job) => {
            const badge = getStatusBadge(job.status);
            const isCompleted = job.status === 'concluido';

            return (
              <div
                key={job.id}
                className="grid grid-cols-12 items-center py-2 px-1 hover:bg-[#16161C] rounded-lg transition-colors group text-[11px]"
              >
                {/* Tarefa */}
                <div className="col-span-5 flex items-center gap-2 pr-2">
                  <img
                    src={job.thumbnailUrl || job.profileAvatarUrl}
                    alt={job.title}
                    className="w-7 h-7 rounded-md object-cover border border-zinc-700 flex-shrink-0"
                  />
                  <div className="truncate">
                    <div className="font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {job.title}
                    </div>
                    <div className="text-[9.5px] text-zinc-400 truncate">
                      Profile: {job.profileName}
                    </div>
                  </div>
                </div>

                {/* Progresso */}
                <div className="col-span-3 px-2">
                  <div className="flex items-center justify-between text-[9.5px] text-zinc-400 mb-0.5">
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCompleted
                          ? 'bg-emerald-400'
                          : job.progress > 50
                          ? 'bg-brand-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span className={`text-[10px] font-medium ${badge.text} truncate`}>
                    {badge.label}
                  </span>
                </div>

                {/* Ações */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => onViewJob(job)}
                    className="px-1.5 py-0.5 text-[10px] text-zinc-300 hover:text-white bg-[#1A1A22] hover:bg-[#252530] border border-[#2B2B38] rounded transition-colors"
                  >
                    Ver
                  </button>
                  {isCompleted && (
                    <button
                      onClick={() => onDownloadJob(job)}
                      className="px-1.5 py-0.5 text-[10px] text-brand-300 hover:text-white bg-brand-950/40 hover:bg-brand-900/60 border border-brand-500/30 rounded transition-colors"
                    >
                      Baixar
                    </button>
                  )}
                  <button
                    onClick={() => onViewJob(job)}
                    className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
