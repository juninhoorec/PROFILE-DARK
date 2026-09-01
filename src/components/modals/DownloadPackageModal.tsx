'use client';

import React, { useState } from 'react';
import { X, Download, Archive, FileText, Video } from 'lucide-react';
import { GenerationJob, MediaLibraryItem } from '@/lib/types';

interface DownloadPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GenerationJob | MediaLibraryItem | null;
}

export const DownloadPackageModal: React.FC<DownloadPackageModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [includeVideo, setIncludeVideo] = useState(true);
  const [includeThumbnail, setIncludeThumbnail] = useState(true);
  const [includeSrt, setIncludeSrt] = useState(true);
  const [includeScript, setIncludeScript] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  const [exportError,setExportError]=useState('');

  if (!isOpen || !item) return null;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setExportError('');
    try {
      const jobId='durationSeconds' in item?item.id:item.id.startsWith('lib_')?item.id.slice(4):'';
      if(!jobId)throw new Error('Este item não está vinculado a um job real.');
      const response=await fetch('/api/export/package',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId,includeVideo,includeThumbnail,includeSrt,includeScript,includeAudio,includeMetadata})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Não foi possível montar o pacote.');
      const bytes=Uint8Array.from(atob(data.base64),(char)=>char.charCodeAt(0));
      const blob=new Blob([bytes],{type:data.mimeType||'application/zip'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setExportError(e instanceof Error?e.message:'Erro ao gerar pacote ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white">
              Baixar Pacote de Mídia Completo
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Target Item summary */}
          <div className="p-3 bg-[#15151B] border border-[#23232C] rounded-xl flex items-center gap-3">
            <img
              src={item.thumbnailUrl || (item as any).profileAvatarUrl}
              alt={item.title}
              className="w-12 h-12 rounded-lg object-cover border border-zinc-700"
            />
            <div className="truncate">
              <div className="font-bold text-white truncate">{item.title}</div>
              <div className="text-[10px] text-zinc-400 truncate">Profile: {item.profileName}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#252530] bg-[#0c0c0f] px-3 py-2 text-[11px] text-zinc-400">O pacote preserva o formato e a resolução reais do job. Nenhuma conversão fictícia para MOV ou 4K é oferecida.</div>
          {exportError&&<div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{exportError}</div>}

          {/* Package items checklist */}
          <div className="space-y-2 bg-[#0C0C0F] p-3 rounded-xl border border-[#1E1E26]">
            <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Arquivos incluídos no .ZIP:
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeVideo}
                onChange={(e) => setIncludeVideo(e.target.checked)}
                className="accent-purple-600"
              />
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span>Vídeo renderizado no formato original</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeThumbnail}
                onChange={(e) => setIncludeThumbnail(e.target.checked)}
                className="accent-purple-600"
              />
              <span>Thumbnail em Alta Resolução (.JPG)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeSrt}
                onChange={(e) => setIncludeSrt(e.target.checked)}
                className="accent-purple-600"
              />
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Legenda Sincronizada (.SRT)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeScript}
                onChange={(e) => setIncludeScript(e.target.checked)}
                className="accent-purple-600"
              />
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Roteiro & Copy Comercial (.TXT)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-200">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="accent-purple-600"
              />
              <span>Metadata & Parâmetros de Geração (.JSON)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold">
            Cancelar
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Compactando...' : 'Baixar Pacote .ZIP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
