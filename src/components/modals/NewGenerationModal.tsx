'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Lock,
  Unlock,
  Upload,
  Link2,
  Package,
  Layers,
  Zap,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import {
  Profile,
  Product,
  CommercialObjective,
  FunnelStage,
  RealismLevel,
  CharacterLock,
  ProductLock,
  CreativePlan,
} from '@/lib/types';
import { PromptEnhancer, PromptEnhanceResult } from '@/lib/ai/prompt-enhancer';
import { CreativeDirector } from '@/lib/ai/creative-director';

interface NewGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  products: Product[];
  selectedProfile: Profile;
  onSelectProfile: (p: Profile) => void;
  onRun3sTest: (profile: Profile, product?: Product) => void;
  onStartJob: (plan: CreativePlan, profile: Profile, product?: Product) => void;
  onOpenPromptEnhancer: (res: PromptEnhanceResult) => void;
  initialContentUrl?: string;
}

export const NewGenerationModal: React.FC<NewGenerationModalProps> = ({
  isOpen,
  onClose,
  profiles,
  products,
  selectedProfile,
  onSelectProfile,
  onRun3sTest,
  onStartJob,
  onOpenPromptEnhancer,
  initialContentUrl,
}) => {
  // Box A - Profile Base
  const [characterLock, setCharacterLock] = useState<CharacterLock>(selectedProfile.characterLock);

  // Box B - Conteúdo
  const [contentUrl, setContentUrl] = useState('');
  const [uploading,setUploading]=useState(false);
  const [uploadStatus,setUploadStatus]=useState('');

  useEffect(() => { if (initialContentUrl) setContentUrl(initialContentUrl); }, [initialContentUrl]);
  useEffect(() => { setCharacterLock(selectedProfile.characterLock); }, [selectedProfile]);

  const uploadReference=async(file?:File)=>{if(!file)return;setUploading(true);setUploadStatus('');try{const form=new FormData();form.append('file',file);const response=await fetch('/api/uploads',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível enviar.');setContentUrl(data.url);setUploadStatus(`${data.name} enviado com sucesso.`);}catch(error){setUploadStatus(error instanceof Error?error.message:'Não foi possível enviar.');}finally{setUploading(false);}};

  // Box C - Produto
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const [productLock, setProductLock] = useState<ProductLock>({
    logo: true,
    color: true,
    shape: true,
    material: true,
    packaging: true,
    text: true,
    details: true,
  });

  // Box D - Prompt & Vendas
  const [rawPrompt, setRawPrompt] = useState('');
  const [objective, setObjective] = useState<CommercialObjective>('conversao');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('meio');
  const [realismLevel, setRealismLevel] = useState<RealismLevel>('ultra-realista');

  if (!isOpen) return null;

  const handleEnhancePrompt = () => {
    const res = PromptEnhancer.enhance({
      rawPrompt: `${rawPrompt}${contentUrl?`\nReferência: ${contentUrl}`:''}`,
      profile: selectedProfile,
      product: selectedProduct,
      objective,
      realismLevel,
    });
    onOpenPromptEnhancer(res);
  };

  const handleGenerateCreativePlan = () => {
    const plan = CreativeDirector.createPlan({
      profile: selectedProfile,
      product: selectedProduct,
      prompt: `${rawPrompt}${contentUrl?`\nReferência editorial: ${contentUrl}`:''}`,
      objective,
      funnelStage,
    });
    const lockedIdentity=Object.entries(characterLock).filter(([,enabled])=>enabled).map(([key])=>key).join(', ')||'nenhum';
    plan.fullScript += `\n\n[CHARACTER LOCK]\nPreservar: ${lockedIdentity}.`;
    onStartJob(plan, selectedProfile, selectedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#101014] border border-[#23232C] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between bg-[#0C0C0F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-purple-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Nova Geração — AI Content & Sales Engine
              </h2>
              <p className="text-xs text-zinc-400">
                Configure os 4 blocos mestres: Profile, Conteúdo, Produto e Prompt com Sales Context.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Master Boxes Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 gap-4">
          {/* BOX A: Profile Base */}
          <div className="bg-[#141419] border border-[#23232D] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-brand-400 font-mono">A.</span> Profile base
              </h3>
              <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${Object.values(characterLock).every(Boolean)?'text-emerald-400 bg-emerald-500/10 border-emerald-500/30':'text-amber-300 bg-amber-500/10 border-amber-500/30'}`}>
                <Lock className="w-3 h-3" />
                <span>{Object.values(characterLock).every(Boolean)?'Character Lock ON':'Lock parcial'}</span>
              </div>
            </div>

            {/* Profile Picker */}
            <div className="flex items-center gap-3 bg-[#0C0C0F] p-2.5 rounded-xl border border-[#1E1E26]">
              <img
                src={selectedProfile?.avatarUrl}
                alt={selectedProfile?.name}
                className="w-12 h-12 rounded-xl object-cover border border-brand-500"
              />
              <div className="flex-1">
                <select
                  value={selectedProfile?.id}
                  onChange={(e) => {
                    const found = profiles.find((p) => p.id === e.target.value);
                    if (found) onSelectProfile(found);
                  }}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#141418]">
                      {p.name} ({p.niche})
                    </option>
                  ))}
                </select>
                <div className="text-[10.5px] text-zinc-400 truncate">
                  {selectedProfile?.dna?.personality}
                </div>
              </div>
            </div>

            {/* Granular Character Lock Toggles */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Bloqueios de Identidade:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                {Object.keys(characterLock).map((key) => {
                  const k = key as keyof CharacterLock;
                  const active = characterLock[k];
                  return (
                    <button
                      key={key}
                      onClick={() => setCharacterLock({ ...characterLock, [k]: !active })}
                      className={`py-1 px-2 rounded-lg border text-center font-medium capitalize flex items-center justify-between ${
                        active
                          ? 'bg-[#1D172E] border-brand-500/40 text-brand-300'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <span>{k}</span>
                      {active ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOX B: Conteúdo / Link / Arquivos */}
          <div className="bg-[#141419] border border-[#23232D] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="text-brand-400 font-mono">B.</span> Conteúdo / Link / Arquivos
            </h3>

            {/* Link input */}
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="Cole link de artigo, YouTube, matéria ou rede social..."
                className="w-full pl-8 pr-3 py-2 bg-[#0C0C0F] border border-[#24242C] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <label className="border border-dashed border-[#353044] bg-[#0C0C0F]/60 rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[90px] cursor-pointer hover:border-brand-500/50">
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,application/pdf" onChange={event=>void uploadReference(event.target.files?.[0])}/>
              <Upload className="w-5 h-5 text-brand-400 mb-1" />
              <span className="text-[11px] font-semibold text-zinc-200">
                {uploading?'Enviando referência...':'Enviar vídeo, imagem, áudio ou PDF'}
              </span>
              <span className="text-[9.5px] text-zinc-400">
                Armazenamento local seguro · máximo de 50 MB
              </span>
              {uploadStatus&&<span role="status" className="mt-1 text-[9.5px] text-emerald-300">{uploadStatus}</span>}
            </label>
          </div>

          {/* BOX C: Produto ou Objeto */}
          <div className="bg-[#141419] border border-[#23232D] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-brand-400 font-mono">C.</span> Produto ou Objeto
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <Lock className="w-3 h-3" />
                <span>Product Lock ON</span>
              </div>
            </div>

            {/* Product Selector */}
            <div className="flex items-center gap-3 bg-[#0C0C0F] p-2.5 rounded-xl border border-[#1E1E26]">
              <img
                src={selectedProduct?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                alt={selectedProduct?.name}
                className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
              />
              <div className="flex-1">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#141418]">
                      {p.name} ({p.brand})
                    </option>
                  ))}
                </select>
                <div className="text-[10.5px] text-zinc-400 truncate">
                  {selectedProduct?.price} • {selectedProduct?.offer || 'Condição de lançamento'}
                </div>
              </div>
            </div>

            {/* Product Lock Controls */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Preservação Fiel do Produto:
              </span>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {['Logo', 'Cor', 'Formato', 'Material', 'Embalagem', 'Texto', 'Detalhes'].map((pKey) => (
                  <span
                    key={pKey}
                    className="py-0.5 px-1.5 rounded bg-[#1D172E] border border-brand-500/30 text-brand-300 text-center font-medium"
                  >
                    ✓ {pKey}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* BOX D: Prompt / Instrução & Contexto de Vendas */}
          <div className="bg-[#141419] border border-[#23232D] rounded-2xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-brand-400 font-mono">D.</span> Prompt & Contexto Comercial
                </h3>
                <button
                  onClick={handleEnhancePrompt}
                  className="text-[10.5px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Melhorar prompt</span>
                </button>
              </div>

              {/* Textarea */}
              <textarea
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder="Descreva o vídeo que você deseja criar... (Ex: Apresentar o perfume destacando fixação e elegância para noite)"
                rows={3}
                className="w-full p-2.5 bg-[#0C0C0F] border border-[#24242C] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500 resize-none"
              />

              {/* Objective & Funnel selectors */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 block mb-0.5">Objetivo</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value as CommercialObjective)}
                    className="w-full py-1 px-2 bg-[#0C0C0F] border border-[#24242C] rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="conversao">Conversão (Venda Direta)</option>
                    <option value="descoberta">Descoberta (Alcance / Topo)</option>
                    <option value="retargeting">Retargeting (Quebra de Objeção)</option>
                    <option value="demonstracao">Demonstração de Produto</option>
                    <option value="autoridade">Autoridade & Conteúdo</option>
                    <option value="prova_social">Prova Social & Review</option>
                    <option value="lifestyle">Lifestyle & Rotina</option>
                    <option value="ugc">UGC Autêntico</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-zinc-400 block mb-0.5">Etapa do Funil</label>
                  <select
                    value={funnelStage}
                    onChange={(e) => setFunnelStage(e.target.value as FunnelStage)}
                    className="w-full py-1 px-2 bg-[#0C0C0F] border border-[#24242C] rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="topo">Topo (Atração & Curiosidade)</option>
                    <option value="meio">Meio (Desejo & Prova)</option>
                    <option value="fundo">Fundo (Chamada de Ação & Oferta)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1E1E26] bg-[#0C0C0F] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onRun3sTest(selectedProfile, selectedProduct);
            }}
            className="px-4 py-2.5 bg-[#1C182A] hover:bg-[#27213C] border border-brand-500/40 text-brand-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>⚡ Fazer teste rápido de 5s primeiro</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateCreativePlan}
              disabled={!rawPrompt.trim()}
              title={!rawPrompt.trim() ? 'Escreva o briefing do vídeo antes de gerar.' : undefined}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-purple-glow flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Plano Criativo & Render</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
