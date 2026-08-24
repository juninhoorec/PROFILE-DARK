'use client';

import React, { useState } from 'react';
import { FolderOpen, Search, Filter, Download, Play, MoreVertical } from 'lucide-react';
import { MediaLibraryItem } from '@/lib/types';
import { INITIAL_LIBRARY_ITEMS } from '@/lib/constants';
import { DownloadPackageModal } from '@/components/modals/DownloadPackageModal';

export default function LibraryPage() {
  const [items, setItems] = useState<MediaLibraryItem[]>(INITIAL_LIBRARY_ITEMS);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'todos' | 'videos' | 'imagens' | 'audios'>('todos');
  const [downloadItem, setDownloadItem] = useState<MediaLibraryItem | null>(null);

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.profileName.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-400" />
            Biblioteca de Conteúdos & Criativos
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Todos os seus vídeos renderizados, thumbnails, áudios e roteiros organizados por personagem.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, personagem ou produto..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-[#20202A] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 bg-[#121216] p-1 rounded-xl border border-[#20202A]">
          {(['todos', 'videos', 'imagens', 'audios'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeType === t
                  ? 'bg-brand-600 text-white shadow-purple-glow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#121216] border border-[#1F1F28] hover:border-brand-500/40 rounded-2xl overflow-hidden group transition-all flex flex-col justify-between shadow-subtle"
          >
            <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[9.5px] font-bold text-zinc-200 uppercase">
                {item.resolution}
              </div>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-medium text-zinc-300">
                {item.duration}
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                  {item.title}
                </h3>
                <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  Profile: {item.profileName}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Tamanho: {item.fileSizeMb} MB
                </div>
              </div>

              <div className="pt-2 border-t border-[#1C1C24] flex items-center gap-2">
                <button
                  onClick={() => alert(`Visualizando vídeo: ${item.title}`)}
                  className="flex-1 py-1.5 bg-[#181822] hover:bg-[#222230] border border-[#272736] rounded-xl text-xs font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Assistir</span>
                </button>
                <button
                  onClick={() => setDownloadItem(item)}
                  className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-purple-glow flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar ZIP</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DownloadPackageModal
        isOpen={!!downloadItem}
        onClose={() => setDownloadItem(null)}
        item={downloadItem}
      />
    </div>
  );
}
