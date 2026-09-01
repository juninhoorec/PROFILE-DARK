'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Link2, UploadCloud, Image as ImageIcon, Video, Music, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateContentCardProps {
  contentUrl: string;
  onChangeContentUrl: (url: string) => void;
  onOpenPromptModal?: () => void;
}

export const GenerateContentCard: React.FC<GenerateContentCardProps> = ({
  contentUrl,
  onChangeContentUrl,
  onOpenPromptModal,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'upload' | 'produto' | 'roteiro'>('link');
  const [uploading,setUploading]=useState(false);
  const [uploadMessage,setUploadMessage]=useState('');
  const [uploadedName,setUploadedName]=useState('');

  const upload=async(file?:File)=>{
    if(!file)return;setUploading(true);setUploadMessage('');
    try{const form=new FormData();form.append('file',file);const response=await fetch('/api/uploads',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível enviar.');onChangeContentUrl(data.url);setUploadedName(data.name);setUploadMessage('Arquivo armazenado com segurança.');}
    catch(error){setUploadMessage(error instanceof Error?error.message:'Não foi possível enviar.');}
    finally{setUploading(false);}
  };

  const tabs = [
    { id: 'link', label: 'Por link' },
    { id: 'upload', label: 'Por upload' },
    { id: 'produto', label: 'Por produto/objeto' },
    { id: 'roteiro', label: 'Por roteiro' },
  ] as const;

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

        {activeTab === 'link' && <><div className="relative mb-3">
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
        </div><button disabled={!contentUrl.trim()} onClick={onOpenPromptModal} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Usar link no gerador</button></>}

        {activeTab === 'upload' && <div className="min-h-[158px] rounded-xl border border-[#302a3d] bg-[#0e0e12] p-5 text-center flex flex-col items-center justify-center"><UploadCloud className="w-6 h-6 text-brand-400 mb-2"/><div className="text-xs font-semibold text-zinc-200">Enviar referência</div><p className="mt-1 text-[10px] leading-4 text-zinc-400">JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, M4A ou PDF · até 50 MB.</p><label className="mt-3 cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-[11px] font-bold text-white"><input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,application/pdf" onChange={event=>void upload(event.target.files?.[0])}/>{uploading?'Enviando...':'Escolher arquivo'}</label>{uploadedName&&<div className="mt-2 max-w-full truncate text-[10px] text-emerald-300">{uploadedName}</div>}{uploadMessage&&<div role="status" className="mt-1 text-[10px] text-zinc-400">{uploadMessage}</div>}{uploadedName&&<button onClick={onOpenPromptModal} className="mt-2 text-[11px] font-bold text-brand-300">Usar no gerador</button>}</div>}
        {activeTab === 'produto' && <div className="min-h-[158px] rounded-xl border border-[#262630] bg-[#0e0e12] p-5 flex flex-col items-center justify-center text-center"><ImageIcon className="w-6 h-6 text-brand-400 mb-2"/><div className="text-xs font-semibold text-white">Importar produto com link afiliado</div><p className="mt-1 text-[10px] leading-4 text-zinc-400">Analise dados públicos, preserve o rastreamento e receba três Profiles recomendados.</p><Link href="/afiliado" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand-300">Abrir importador <ArrowRight className="w-3 h-3"/></Link></div>}
        {activeTab === 'roteiro' && <div className="min-h-[158px] rounded-xl border border-[#262630] bg-[#0e0e12] p-5 flex flex-col items-center justify-center text-center"><FileText className="w-6 h-6 text-brand-400 mb-2"/><div className="text-xs font-semibold text-white">Criar a partir de um briefing</div><p className="mt-1 text-[10px] leading-4 text-zinc-400">Escolha Profile, produto, objetivo comercial e escreva o roteiro no gerador profissional.</p><button onClick={onOpenPromptModal} className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand-300">Abrir gerador <ArrowRight className="w-3 h-3"/></button></div>}
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
