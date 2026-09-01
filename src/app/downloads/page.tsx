'use client';

import React, { useState } from 'react';
import { Download, Archive, CheckCircle2, FileText, Film } from 'lucide-react';
import { DownloadPackageModal } from '@/components/modals/DownloadPackageModal';
import { MediaLibraryItem } from '@/lib/types';

export default function DownloadsPage() {
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null);
  const [items, setItems] = useState<MediaLibraryItem[]>([]);

  React.useEffect(() => {
    fetch('/api/library').then((response) => response.json()).then((data) => data.items && setItems(data.items)).catch(() => {});
  }, []);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-brand-400" />
            Central de Downloads & Exportação
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Exporte vídeos em 4K/1080p, pacotes completos de mídia (.ZIP) com legendas SRT e scripts sincronizados.
          </p>
        </div>
      </div>

      <div className="bg-[#121216] border border-[#1F1F28] rounded-2xl p-6 space-y-4 shadow-subtle">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Exportações Prontas
        </h2>

        <div className="divide-y divide-[#1C1C24]">
          {items.map((item) => (
            <div key={item.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                />
                <div>
                  <h3 className="text-xs font-bold text-white">{item.title}</h3>
                  {item.isDemo && <span className="inline-block mt-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">DEMO — arquivo não exportável</span>}
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Profile: {item.profileName} • {item.resolution} • {item.duration} • {item.fileSizeMb} MB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  disabled={item.isDemo || !item.videoUrl}
                  title={item.isDemo ? 'Dados de demonstração não geram download' : 'Baixar pacote real'}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-purple-glow flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Baixar Pacote .ZIP</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DownloadPackageModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </div>
  );
}
