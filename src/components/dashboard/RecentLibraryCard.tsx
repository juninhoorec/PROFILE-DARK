'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Download, MoreVertical } from 'lucide-react';
import { MediaLibraryItem } from '@/lib/types';

interface RecentLibraryCardProps {
  items: MediaLibraryItem[];
  onPreviewItem: (item: MediaLibraryItem) => void;
  onDownloadItem: (item: MediaLibraryItem) => void;
}

export const RecentLibraryCard: React.FC<RecentLibraryCardProps> = ({
  items,
  onPreviewItem,
  onDownloadItem,
}) => {
  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 shadow-subtle">
      {/* Header with Ver biblioteca completa */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-xs font-bold text-white tracking-wide">
          6. Biblioteca recente
        </h3>
        <Link
          href="/biblioteca"
          className="text-[11px] font-medium text-zinc-400 hover:text-brand-300 flex items-center gap-0.5 transition-colors"
        >
          <span>Ver biblioteca completa</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 5 Cards Grid */}
      <div className="grid grid-cols-5 gap-3">
        {items.slice(0, 5).map((item) => {
          const isRendering = item.status === 'renderizando';

          return (
            <div
              key={item.id}
              className="bg-[#0E0E12] border border-[#1E1E24] hover:border-brand-500/40 rounded-xl overflow-hidden group transition-all flex flex-col justify-between"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Resolution Badge Top Right */}
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm rounded text-[9px] font-bold text-zinc-200 uppercase">
                  {item.resolution}
                </div>

                {/* Duration Badge Bottom Right */}
                {item.duration && (
                  <div className="absolute bottom-1.5 right-1.5 px-1 py-0.5 bg-black/75 backdrop-blur-sm rounded text-[8.5px] font-medium text-zinc-300">
                    {item.duration}
                  </div>
                )}

                {/* Play Hover Overlay */}
                <div
                  onClick={() => onPreviewItem(item)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-purple-glow">
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Body details */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-100 line-clamp-1 group-hover:text-brand-300 transition-colors">
                    {item.title}
                  </h4>
                  <div className="text-[9.5px] text-zinc-400 mt-0.5 truncate">
                    {item.profileName}
                  </div>
                </div>

                {/* Status pill & Actions */}
                <div className="mt-2.5 pt-2 border-t border-[#1C1C22] flex flex-col gap-1.5">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isRendering ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <span
                      className={`text-[9.5px] font-medium ${
                        isRendering ? 'text-purple-400' : 'text-emerald-400'
                      }`}
                    >
                      {isRendering ? `Renderizando ${item.progress || 80}%` : 'Concluído'}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPreviewItem(item)}
                      className="flex-1 py-1 text-[10px] font-semibold text-zinc-300 hover:text-white bg-[#181820] hover:bg-[#22222E] border border-[#272734] rounded-lg transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => onDownloadItem(item)}
                      className="flex-1 py-1 text-[10px] font-semibold text-brand-300 hover:text-white bg-brand-950/40 hover:bg-brand-900/60 border border-brand-500/30 rounded-lg transition-colors"
                    >
                      Baixar
                    </button>
                    <button className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
