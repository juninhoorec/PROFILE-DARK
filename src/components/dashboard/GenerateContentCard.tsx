'use client';

import React, { useState } from 'react';
import { Link2, UploadCloud, Image as ImageIcon, Video, Music, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateContentCardProps {
  contentUrl: string;
  onChangeContentUrl: (url: string) => void;
  onOpenPromptModal?: () => void;
}

export const GenerateContentCard: React.FC<GenerateContentCardProps> = ({
  contentUrl,
  onChangeContentUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'upload' | 'produto' | 'roteiro'>('link');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const tabs = [
    { id: 'link', label: 'Por link' },
    { id: 'upload', label: 'Por upload' },
    { id: 'produto', label: 'Por produto/objeto' },
    { id: 'roteiro', label: 'Por roteiro' },
  ] as const;

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
  };

  return (
    <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 flex flex-col justify-between h-[360px] shadow-subtle relative">
      <div>
        {/* Header & Tabs */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white tracking-wide">
            1. Gerar conteúdo
          </h3>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 bg-[#0D0D10] p-1 rounded-xl border border-[#1C1C22] mb-3.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg transition-all text-center',
                activeTab === t.id
                  ? 'bg-[#23173D] text-brand-300 font-semibold border border-brand-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Link Input */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <Link2 className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={contentUrl}
            onChange={(e) => onChangeContentUrl(e.target.value)}
            placeholder="Cole aqui um link do conteúdo, produto ou referência"
            className="w-full pl-9 pr-3 py-2 bg-[#0E0E12] border border-[#24242C] focus:border-brand-500 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={cn(
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px]',
            isDragging
              ? 'border-brand-500 bg-[#1E1535]/30'
              : 'border-[#262630] bg-[#0E0E12]/50 hover:bg-[#15151B] hover:border-zinc-700'
          )}
        >
          <input
            type="file"
            id="file-upload-input"
            className="hidden"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
            <UploadCloud className="w-6 h-6 text-brand-400 mb-1.5" />
            <div className="text-[11px] font-semibold text-zinc-200">
              Arraste arquivos aqui ou clique para enviar
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Suporte: imagens, vídeos, áudios e PDFs
            </div>
          </label>

          {uploadedFiles.length > 0 && (
            <div className="mt-2 text-[10px] text-emerald-400 font-medium truncate max-w-full">
              ✓ {uploadedFiles.length} arquivo(s) carregado(s)
            </div>
          )}
        </div>
      </div>

      {/* File format badges at bottom */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[#1C1C22]">
        <div className="bg-[#16161C] border border-[#23232C] rounded-lg py-1 px-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-amber-400">
            <ImageIcon className="w-3 h-3" />
            <span>Imagem</span>
          </div>
          <div className="text-[8px] text-zinc-400">JPG • PNG • WEBP</div>
        </div>

        <div className="bg-[#16161C] border border-[#23232C] rounded-lg py-1 px-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-blue-400">
            <Video className="w-3 h-3" />
            <span>Vídeo</span>
          </div>
          <div className="text-[8px] text-zinc-400">MP4 • MOV • WEBM</div>
        </div>

        <div className="bg-[#16161C] border border-[#23232C] rounded-lg py-1 px-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-purple-400">
            <Music className="w-3 h-3" />
            <span>Áudio</span>
          </div>
          <div className="text-[8px] text-zinc-400">MP3 • WAV • M4A</div>
        </div>

        <div className="bg-[#16161C] border border-[#23232C] rounded-lg py-1 px-1.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-red-400">
            <FileText className="w-3 h-3" />
            <span>PDF</span>
          </div>
          <div className="text-[8px] text-zinc-400">Até 50MB</div>
        </div>
      </div>
    </div>
  );
};
