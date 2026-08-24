'use client';

import React, { useState } from 'react';
import { X, Download, Archive, CheckSquare, Square, FileText, Video, Music, Check, Sparkles } from 'lucide-react';
import { GenerationJob, MediaLibraryItem } from '@/lib/types';
import JSZip from 'jszip';

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
  const [format, setFormat] = useState<'mp4' | 'mov'>('mp4');
  const [resolution, setResolution] = useState<'1080p' | '4k'>('1080p');
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen || !item) return null;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = `ProfileDark_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const folder = zip.folder(folderName) || zip;

      if (includeScript) {
        folder.file(
          'roteiro_completo.txt',
          `ROTEIRO PROFILE DARK\nTítulo: ${item.title}\nPersonagem: ${item.profileName}\n\n[HOOK]\nDescubra o segredo para transformar sua rotina com qualidade absoluta.\n\n[DEMONSTRAÇÃO]\nVisual autêntico com iluminação 4K e textura real.\n\n[CTA]\nGaranta o seu hoje mesmo no link oficial!`
        );
        folder.file(
          'legenda_social.txt',
          `${item.title}\n\n👉 Acesse o link oficial na bio!\n\n#ProfileDark #Viral #IA #Vendas`
        );
      }

      if (includeSrt) {
        const srtContent = `1\n00:00:00,000 --> 00:00:03,500\nDescubra o segredo para transformar sua rotina.\n\n2\n00:00:03,500 --> 00:00:15,000\nAlta qualidade com fidelidade absoluta de produto.\n\n3\n00:00:15,000 --> 00:00:20,000\nGaranta o seu hoje mesmo no link oficial!\n`;
        folder.file('legendas.srt', srtContent);
      }

      if (includeMetadata) {
        const metadata = {
          title: item.title,
          profile: item.profileName,
          resolution,
          format,
          exportedAt: new Date().toISOString(),
        };
        folder.file('metadata.json', JSON.stringify(metadata, null, 2));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar pacote ZIP.');
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

          {/* Formats & Resolution */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1 font-semibold">Formato</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormat('mp4')}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-semibold ${
                    format === 'mp4' ? 'bg-brand-600 border-brand-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  MP4 (Padrão)
                </button>
                <button
                  onClick={() => setFormat('mov')}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-semibold ${
                    format === 'mov' ? 'bg-brand-600 border-brand-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  MOV (ProRes)
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 font-semibold">Resolução</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResolution('1080p')}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-semibold ${
                    resolution === '1080p' ? 'bg-brand-600 border-brand-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  1080p
                </button>
                <button
                  onClick={() => setResolution('4k')}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-semibold ${
                    resolution === '4k' ? 'bg-brand-600 border-brand-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  4K Ultra
                </button>
              </div>
            </div>
          </div>

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
              <span>Vídeo Renderizado ({resolution.toUpperCase()} • {format.toUpperCase()})</span>
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
