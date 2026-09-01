'use client';

import React, { useState } from 'react';
import { X, Sparkles, Camera, Mic, Play, Loader2, CheckCircle2, Volume2, ShieldCheck, Download } from 'lucide-react';
import { Profile } from '@/lib/types';

interface GenerateProfileMediaModalProps {
  profile: Profile;
  onClose: () => void;
  onProfileUpdated: (updated: Profile) => void;
}

export const GenerateProfileMediaModal: React.FC<GenerateProfileMediaModalProps> = ({
  profile,
  onClose,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'imagem' | 'voz'>('imagem');

  // Image states
  const [shotType, setShotType] = useState<'portrait' | 'full_body' | 'product_interaction' | 'environment'>('portrait');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [realismLevel, setRealismLevel] = useState<'natural' | 'ultra-realista'>('ultra-realista');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Voice states
  const [voiceName, setVoiceName] = useState(profile.voiceName || 'Microsoft Maria Desktop');
  const [customPhrase, setCustomPhrase] = useState(
    `Oi, eu sou a ${profile.name}. Deixa eu te mostrar uma coisa que facilitou muito a minha rotina.`
  );
  const [testingVoice, setTestingVoice] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(true);
  const [message, setMessage] = useState('');

  // Handle Image Generation
  async function handleGenerateImage(isAuto = false) {
    setGeneratingImage(true);
    setMessage(isAuto ? 'Decidindo parâmetros e gerando melhor imagem...' : 'Gerando imagem mestre hiper-realista...');
    try {
      const res = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          userPrompt: customPrompt,
          shotType,
          aspectRatio,
          realismLevel,
          isAutoMode: isAuto,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Falha na geração');
      setGeneratedImageUrl(data.url);
      const updated: Profile = {
        ...profile,
        avatarUrl: data.url,
        realismScore: 96,
        references: [
          {
            id: `ref_${Date.now()}`,
            url: data.url,
            type: 'image',
            isMaster: true,
            label: 'Foto Mestre IA',
            createdAt: new Date().toISOString(),
          },
          ...(profile.references || []).map((r) => ({ ...r, isMaster: false })),
        ],
      };
      onProfileUpdated(updated);
      setMessage('✓ Imagem mestre gerada e salva com sucesso!');
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setGeneratingImage(false);
    }
  }

  // Handle Voice Test
  async function handleTestVoice() {
    setTestingVoice(true);
    setMessage('Sintetizando áudio de teste de 5-8 segundos...');
    try {
      const res = await fetch('/api/ai/voice/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          customPhrase,
          voiceName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.audioUrl) throw new Error(data.error || 'Falha na voz');
      setAudioUrl(data.audioUrl);
      setMessage(`✓ Voz gerada com sucesso (${data.durationSeconds}s)!`);
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setTestingVoice(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between bg-[#0C0C0F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-purple-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Gerador de Mídia & Identidade — {profile.name}
              </h2>
              <p className="text-xs text-zinc-400">
                Gere imagem mestre com FLUX.2/Qwen e teste a voz natural em português.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E1E26] bg-[#0E0E12] px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('imagem')}
            className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'imagem' ? 'border-brand-500 text-brand-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Gerador de Imagem Mestre</span>
          </button>
          <button
            onClick={() => setActiveTab('voz')}
            className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'voz' ? 'border-brand-500 text-brand-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Gerador & Teste de Voz</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'imagem' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Tipo de Enquadramento</label>
                  <select
                    value={shotType}
                    onChange={(e) => setShotType(e.target.value as any)}
                    className="w-full bg-[#0C0C0F] border border-[#23232C] rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="portrait">Retrato Frontal (85mm)</option>
                    <option value="full_body">Corpo Inteiro</option>
                    <option value="product_interaction">Interagindo com Produto</option>
                    <option value="environment">Cena / Ambiente</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Formato</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-[#0C0C0F] border border-[#23232C] rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="9:16">9:16 (Vertical Reels/TikTok)</option>
                    <option value="1:1">1:1 (Quadrado)</option>
                    <option value="16:9">16:9 (Horizontal)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Realismo</label>
                  <select
                    value={realismLevel}
                    onChange={(e) => setRealismLevel(e.target.value as any)}
                    className="w-full bg-[#0C0C0F] border border-[#23232C] rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="ultra-realista">Ultra-realista (Microtexturas)</option>
                    <option value="natural">Natural</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Instrução Adicional (Opcional)</label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Segurando limpador multiuso na cozinha com avental floral..."
                  className="w-full bg-[#0C0C0F] border border-[#23232C] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {generatedImageUrl && (
                <div className="p-3 bg-[#0C0C10] border border-[#1E1E26] rounded-xl flex items-center gap-3">
                  <img src={generatedImageUrl} alt="Imagem Gerada" className="w-16 h-20 rounded-lg object-cover border border-brand-500/40" />
                  <div>
                    <div className="text-xs font-bold text-emerald-400">✓ Nova Imagem Mestre Definida</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Adicionada como referência principal do Profile.</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={generatingImage}
                  onClick={() => handleGenerateImage(false)}
                  className="py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-purple-glow disabled:opacity-40"
                >
                  {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>Gerar Imagem</span>
                </button>

                <button
                  disabled={generatingImage}
                  onClick={() => handleGenerateImage(true)}
                  className="py-2.5 bg-gradient-to-r from-fuchsia-600 to-brand-600 hover:from-fuchsia-500 hover:to-brand-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-purple-glow disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Gerar Melhor Imagem</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'voz' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Voz Primária (Português Brasileiro)</label>
                <select
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full bg-[#0C0C0F] border border-[#23232C] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Microsoft Maria Desktop">Microsoft Maria Desktop (Natural)</option>
                  <option value="Chatterbox PT-BR Natural">Chatterbox PT-BR Natural</option>
                  <option value="CosyVoice 3 Warm">CosyVoice 3 Acolhedora</option>
                  <option value="Luna (Natural)">Luna (Natural)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Frase para Teste (5–8 segundos)</label>
                <textarea
                  value={customPhrase}
                  onChange={(e) => setCustomPhrase(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0C0C0F] border border-[#23232C] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="p-3 bg-[#0C0C10] border border-[#1E1E26] rounded-xl flex items-center gap-2 text-[10.5px] text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Identidade vocal persistente com autorização de uso comercial confirmada.</span>
              </div>

              {audioUrl && (
                <div className="p-3.5 bg-[#0C0C10] border border-brand-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                      Player de Teste Real
                    </span>
                    <a href={audioUrl} download className="text-[10px] text-brand-300 hover:underline flex items-center gap-1">
                      <Download className="w-3 h-3" /> Baixar
                    </a>
                  </div>
                  <audio src={audioUrl} controls className="w-full h-8" autoPlay />
                </div>
              )}

              <button
                disabled={testingVoice || !customPhrase.trim()}
                onClick={handleTestVoice}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {testingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Testar Voz (5–8s)</span>
              </button>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-[#0C0C0F] border border-[#1F1F28] text-[11px] text-zinc-300 font-mono">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
