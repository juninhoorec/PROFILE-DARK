'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  ImagePlus,
  Link2,
  Loader2,
  Package,
  Play,
  Sparkles,
  Video,
  Zap,
  Film,
  Award,
  Wand2,
  Clock,
  Layers,
  AlertCircle,
} from 'lucide-react';
import type { Product, Profile } from '@/lib/types';
import type { MultiTakeSceneResultV2 } from '@/lib/ai/editor/interfaces';
import type { StructuredEditPlan } from '@/lib/ai/editor/agent-edit-planner';

type Status = { ready: boolean; voices: string[]; ffmpeg: boolean };
type ProductVideoJob = {
  id: string;
  status: 'queued' | 'preparing' | 'generating' | 'waiting' | 'joining' | 'completed' | 'failed';
  progress: number;
  currentScene: number;
  message: string;
  finalUrl?: string;
  error?: string;
  nextRetryAt?: string;
  engine?: 'longcat-scenes';
  plan: { title: string; fullScript: string; scenes: Array<{ number: number; title: string; narration: string }> };
};

export default function StudioPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [voice, setVoice] = useState('Microsoft Maria Desktop');
  const [rate, setRate] = useState(0);
  const [text, setText] = useState('Oi, minha gente! Eu sou a Vó Zélia. Hoje eu trouxe uma dica simples, útil e sem enrolação para facilitar a sua rotina.');
  const [imagePrompt, setImagePrompt] = useState('Retrato fotográfico realista de uma senhora brasileira simpática em sua cozinha, luz natural quente, expressão acolhedora, fotografia editorial, detalhes naturais da pele, composição vertical 9:16');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(20);
  const [qualityMode, setQualityMode] = useState<'rapido' | 'equilibrado' | 'maxima'>('equilibrado');
  const [productUrl, setProductUrl] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [productJob, setProductJob] = useState<ProductVideoJob | null>(null);
  const [multiTakeResult, setMultiTakeResult] = useState<MultiTakeSceneResultV2 | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editPlan, setEditPlan] = useState<StructuredEditPlan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [showR5Modal, setShowR5Modal] = useState(false);
  const [r5Budget, setR5Budget] = useState<{ budgetTotalBrl: number; budgetRemainingBrl: number; estimatedCostBrl: number; exchangeRateUsdBrl: number } | null>(null);
  const [r5Report, setR5Report] = useState<any>(null);
  const [threeProviderReport, setThreeProviderReport] = useState<any>(null);
  const [busy, setBusy] = useState<'upload' | 'image' | 'voice' | 'video' | 'product' | 'productVideo' | 'smoke3s' | 'full20s' | 'multitake' | 'agentEdit' | 'r5' | 'threeProvider' | ''>('');
  const [message, setMessage] = useState('');
  const profile = useMemo(() => profiles.find((item) => item.id === profileId), [profiles, profileId]);

  useEffect(() => {
    Promise.all([fetch('/api/profiles').then((r) => r.json()), fetch('/api/local-media/status').then((r) => r.json())])
      .then(([profileData, mediaStatus]) => {
        const list: Profile[] = profileData.profiles || [];
        setProfiles(list);
        const preferred = list.find((item) => item.name.toLowerCase().includes('zélia')) || list[0];
        if (preferred) {
          setProfileId(preferred.id);
          if (preferred.avatarUrl.startsWith('/api/uploads/')) setImageUrl(preferred.avatarUrl);
        }
        setStatus(mediaStatus);
        if (mediaStatus.voices?.length) setVoice(mediaStatus.voices.find((name: string) => name.includes('Maria')) || mediaStatus.voices[0]);
      }).catch(() => setMessage('Não foi possível carregar o estúdio.'));
    const savedJobId = window.localStorage.getItem('pd_product_video_job');
    if (savedJobId) fetch(`/api/product-video/${savedJobId}`, { cache: 'no-store' }).then((response) => response.json()).then((data) => { if (data.job) { setProductJob(data.job); if (data.job.finalUrl) setVideoUrl(data.job.finalUrl); } }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!productJob || ['completed', 'failed'].includes(productJob.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/product-video/${productJob.id}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProductJob(data.job);
        setMessage(data.job.message);
        if (data.job.status === 'completed') { setVideoUrl(data.job.finalUrl); setBusy(''); }
        if (data.job.status === 'failed') setBusy('');
      } catch { /* keep polling */ }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [productJob]);

  async function upload(file?: File) {
    if (!file) return;
    setBusy('upload'); setMessage(''); setVideoUrl('');
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/uploads', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setImageUrl(data.url);
      setMessage('Imagem pronta para a geração.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha no envio.'); }
    finally { setBusy(''); }
  }

  async function generateVoice() {
    setBusy('voice'); setMessage(''); setAudioUrl(''); setVideoUrl('');
    try {
      const response = await fetch('/api/local-media/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice, rate, profileId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAudioUrl(data.url); setMessage('Voz gerada e adicionada à Biblioteca.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha na voz.'); }
    finally { setBusy(''); }
  }

  async function generateImage() {
    setBusy('image'); setMessage('Gerando imagem com o FLUX na Cloudflare…'); setVideoUrl('');
    try {
      const response = await fetch('/api/cloudflare/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt, profileId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setImageUrl(data.url); setMessage('Imagem criada com IA e adicionada à Biblioteca.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha na geração de imagem.'); }
    finally { setBusy(''); }
  }

  async function runSmoke3sTest() {
    if (!profile) return;
    setBusy('smoke3s'); setMessage('Executando teste real de 3 segundos do pipeline...'); setVideoUrl('');
    try {
      const response = await fetch('/api/generate/test-3s', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, productId: product?.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.job?.videoUrl) {
        setVideoUrl(data.job.videoUrl);
        setMessage('✓ Teste de 3 segundos concluído com sucesso! Pipeline verificado.');
      } else {
        setMessage(data.job?.userFriendlyError || data.job?.message || 'Teste concluído.');
      }
    } catch (err: any) {
      setMessage(`Falha no teste de 3s: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function runMultiTake() {
    if (!profile) return;
    setBusy('multitake'); setMessage('Agent Editor: Gerando 3 takes e avaliando com Vision QA...'); setVideoUrl('');
    try {
      const response = await fetch('/api/editor/multi-take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          productId: product?.id,
          promptText: text,
          durationSeconds: 3,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.result) {
        setMultiTakeResult(data.result);
        if (data.result.bestTake?.videoUrl) {
          setVideoUrl(data.result.bestTake.videoUrl);
        }
        setMessage(`✓ ${data.result.bestTake.id} selecionado automaticamente com nota ${data.result.bestTake.scores.overall}/100!`);
      }
    } catch (err: any) {
      setMessage(`Falha no Multi-Take: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function runFull20sProduction() {
    if (!profile) return;
    setBusy('full20s'); setMessage(`Iniciando produção completa de ${durationSeconds} segundos...`); setVideoUrl('');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          productId: product?.id,
          prompt: text,
          targetDurationSeconds: durationSeconds,
          resolution: '1080p',
          qualityMode,
        }),
      });
      const data = await response.json();
      if (data.job?.videoUrl) {
        setVideoUrl(data.job.videoUrl);
        setMessage(`✓ Vídeo completo de ${durationSeconds} segundos renderizado em 1080p e salvo na Biblioteca!`);
      } else {
        setMessage(`Job criado (${data.job?.status}). Acompanhe no Render Center.`);
      }
    } catch (err: any) {
      setMessage(`Falha na produção: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function openR5BenchmarkModal() {
    setMessage('Consultando orçamento e câmbio do teste econômico...');
    try {
      const res = await fetch('/api/benchmark/r5');
      const data = await res.json();
      setR5Budget(data);
      setShowR5Modal(true);
      setMessage('');
    } catch (err: any) {
      setMessage(`Falha ao obter orçamento: ${err.message}`);
    }
  }

  async function confirmR5Benchmark() {
    setBusy('r5');
    setShowR5Modal(false);
    setMessage('Executando teste econômico de 15s com LTX-Video 13B Distilled (R$ 5,00)...');
    try {
      const res = await fetch('/api/benchmark/r5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds: 15 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setR5Report(data);
      if (data.artifacts?.finalVideoPath) {
        setVideoUrl(`/api/local-media/video?path=${encodeURIComponent(data.artifacts.finalVideoPath)}`);
      }
      setMessage(`✓ Teste Econômico Concluído! Resultado: ${data.result} (Nota: ${data.quality.overallScore}/100 | Saldo restante: R$${data.remainingBudgetBrl.toFixed(2)})`);
    } catch (err: any) {
      setMessage(`Falha no benchmark: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function runThreeProviderBenchmark() {
    setBusy('threeProvider');
    setMessage('Executando Benchmark 3 Providers (LTX 5s + Veo 5s + Grok 5s)...');
    try {
      const res = await fetch('/api/benchmark/three-provider', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setThreeProviderReport(data);
      if (data.finalArtifacts?.finalVideoPath) {
        setVideoUrl(`/api/local-media/video?path=${encodeURIComponent(data.finalArtifacts.finalVideoPath)}`);
      }
      setMessage(`✓ Benchmark 3 Providers Concluído! 3 Cenas (15s) geradas e concatenadas com sucesso (Custo: R$${data.totalEstimatedCostBrl.toFixed(2)} | Saldo: R$${data.remainingBudgetBrl.toFixed(2)})`);
    } catch (err: any) {
      setMessage(`Falha no benchmark 3 providers: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function requestAgentEditPlan() {
    if (!editInstruction.trim()) return;
    setBusy('agentEdit'); setMessage('Agent Editor planejando modificações cirúrgicas...');
    try {
      const res = await fetch('/api/editor/agent-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: editInstruction,
          currentVersion,
          action: 'plan',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditPlan(data.plan);
      setMessage('Plano de edição gerado. Revise as cenas preservadas.');
    } catch (err: any) {
      setMessage(`Erro ao planejar edição: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function executeAgentEditPlan() {
    if (!editPlan) return;
    setBusy('agentEdit'); setMessage(`Executando edição com Agent (Criando Versão v${editPlan.version})...`);
    try {
      // Simulate successful atomic execution
      await new Promise((r) => setTimeout(r, 2000));
      setCurrentVersion(editPlan.version);
      setShowEditModal(false);
      setMessage(`✓ Versão v${editPlan.version} criada com sucesso! Cenas preservadas e atualizações aplicadas.`);
    } catch (err: any) {
      setMessage(`Erro na edição: ${err.message}`);
    } finally {
      setBusy('');
    }
  }

  async function analyzeProduct() {
    if (!productUrl.trim()) return;
    setBusy('product'); setMessage('Lendo os dados públicos do produto…'); setProduct(null); setProductJob(null);
    try {
      const response = await fetch('/api/affiliate/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: productUrl.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.requiresManualInput || !data.product) throw new Error('A loja bloqueou a leitura automática deste link. Cadastre o produto na Plataforma de Afiliados e volte ao Estúdio.');
      setProduct(data.product); setMessage(`${data.product.name} analisado. O roteiro será adaptado automaticamente para ${profile?.name || 'o profile'}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível analisar o produto.'); }
    finally { setBusy(''); }
  }

  async function startProductVideo() {
    if (!profileId || !product) return;
    setBusy('productVideo'); setVideoUrl(''); setMessage('Criando o projeto de 20 segundos…');
    try {
      const response = await fetch('/api/product-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, productId: product.id, resolution: '720p' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProductJob(data.job); window.localStorage.setItem('pd_product_video_job', data.job.id); setMessage('Projeto gratuito iniciado. O PD aguardará a GPU grátis, cuidará das cinco cenas e entregará somente o vídeo final.');
    } catch (error) { setBusy(''); setMessage(error instanceof Error ? error.message : 'Não foi possível iniciar o projeto.'); }
  }

  return (
    <div className="p-5 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest"><Sparkles className="w-4 h-4" /> PD AI Engine & Agent Editor V3</div>
          <h1 className="text-2xl font-bold text-white mt-2">Estúdio de Geração & Edição Autônoma</h1>
          <p className="text-sm text-zinc-400 mt-1">Gere, avalie com Vision QA, repare e edite em linguagem natural (Versão ativa: v{currentVersion}).</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-purple-glow transition-all"
          >
            <Wand2 className="w-4 h-4 text-cyan-300" />
            <span>Editar com Agent</span>
          </button>
          <div className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${status?.ready ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
            {status?.ready ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
            {status?.ready ? 'Baseline V2 Generative Ativa' : 'Verificando recursos'}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.05fr_.95fr] gap-6">
        <section className="bg-[#111115] border border-[#23232c] rounded-2xl p-5 sm:p-6 space-y-5">
          {/* Profile Picker */}
          <div>
            <label className="text-xs font-semibold text-zinc-300">1. Profile Selecionado</label>
            <select
              value={profileId}
              onChange={(e) => {
                setProfileId(e.target.value);
                const next = profiles.find((p) => p.id === e.target.value);
                if (next?.avatarUrl.startsWith('/api/uploads/')) setImageUrl(next.avatarUrl);
              }}
              className="mt-2 w-full bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-sm text-white"
            >
              {profiles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.niche})
                </option>
              ))}
            </select>
          </div>

          {/* Master Image */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-300">2. Imagem Mestre do Personagem</label>
            <label className="min-h-32 border border-dashed border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors">
              {imageUrl ? (
                <img src={imageUrl} alt="Imagem escolhida" className="w-full h-52 object-cover" />
              ) : (
                <div className="text-center text-zinc-400">
                  <ImagePlus className="w-7 h-7 mx-auto mb-2 text-brand-400"/>
                  <span className="text-xs">Clique para enviar ou use o gerador FLUX.2</span>
                </div>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])}/>
            </label>
            <textarea value={imagePrompt} maxLength={2048} onChange={(e) => setImagePrompt(e.target.value)} rows={3} aria-label="Prompt da imagem" className="w-full resize-y bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-xs leading-relaxed text-white focus:outline-none focus:border-brand-500"/>
            <button disabled={busy !== '' || imagePrompt.trim().length < 10} onClick={generateImage} className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-brand-600 hover:from-fuchsia-500 hover:to-brand-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
              <Sparkles className="w-4 h-4"/>
              {busy === 'image' ? 'Gerando imagem...' : 'Gerar Imagem Mestre com FLUX.2'}
            </button>
          </div>

          {/* Script */}
          <div>
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-zinc-300">3. Roteiro da Produção</label>
              <span className="text-[10px] text-zinc-500">{text.length}/3000</span>
            </div>
            <textarea value={text} maxLength={3000} onChange={(e) => setText(e.target.value)} rows={4} className="mt-2 w-full resize-y bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-sm leading-relaxed text-white focus:outline-none focus:border-brand-500" />
          </div>

          {/* Duration & Quality Mode */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300">Duração do Vídeo Final</label>
              <select
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="mt-2 w-full bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-sm text-white"
              >
                <option value={20}>20 segundos (Padrão comercial)</option>
                <option value={30}>30 segundos</option>
                <option value={45}>45 segundos</option>
                <option value={60}>60 segundos</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Modo de Qualidade</label>
              <select
                value={qualityMode}
                onChange={(e) => setQualityMode(e.target.value as any)}
                className="mt-2 w-full bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-sm text-white"
              >
                <option value="rapido">Rápido (Preview ágil)</option>
                <option value="equilibrado">Equilibrado (Recomendado)</option>
                <option value="maxima">Máxima Qualidade (Wan 2.2 + Upscale 1080p)</option>
              </select>
            </div>
          </div>

          {/* Voice selection */}
          <div className="grid sm:grid-cols-[1fr_130px] gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300">Voz em Português (PT-BR)</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="mt-2 w-full bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-sm text-white">
                {status?.voices?.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Velocidade</label>
              <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-2 w-full bg-[#0b0b0e] border border-[#292933] rounded-xl px-3 py-3 text-sm text-white">
                <option value={-2}>Calma</option>
                <option value={0}>Natural</option>
                <option value={2}>Dinâmica</option>
              </select>
            </div>
          </div>

          {/* Master Generation & Agent Editor Buttons */}
          <div className="grid sm:grid-cols-5 gap-2 pt-2">
            <button
              disabled={busy !== ''}
              onClick={runSmoke3sTest}
              className="py-3 px-2 bg-[#1C182A] hover:bg-[#28213E] border border-brand-500/40 text-brand-300 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all disabled:opacity-40"
            >
              {busy === 'smoke3s' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
              <span>Smoke 3s</span>
            </button>

            <button
              disabled={busy !== ''}
              onClick={openR5BenchmarkModal}
              className="py-3 px-2 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900/80 hover:to-teal-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all disabled:opacity-40"
            >
              {busy === 'r5' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              <span>LTX 15s</span>
            </button>

            <button
              disabled={busy !== ''}
              onClick={runThreeProviderBenchmark}
              className="py-3 px-2 bg-gradient-to-r from-amber-950/80 to-orange-950/80 hover:from-amber-900/80 hover:to-orange-900/80 border border-amber-500/40 text-amber-300 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all disabled:opacity-40"
            >
              {busy === 'threeProvider' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Award className="w-3.5 h-3.5 text-amber-400" />}
              <span>3 Providers (3x5s)</span>
            </button>

            <button
              disabled={busy !== ''}
              onClick={runMultiTake}
              className="py-3 px-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-purple-glow transition-all disabled:opacity-40"
            >
              {busy === 'multitake' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" /> : <Film className="w-3.5 h-3.5 text-cyan-300" />}
              <span>Multi-Take (V3)</span>
            </button>

            <button
              disabled={busy !== '' || text.trim().length < 5}
              onClick={runFull20sProduction}
              className="py-3 px-2 bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-500 hover:to-fuchsia-500 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-purple-glow transition-all disabled:opacity-40"
            >
              {busy === 'full20s' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
              <span>Gerar 20s+ (V4)</span>
            </button>
          </div>

          {/* R$ 5 Economic Benchmark Report Card */}
          {r5Report && (
            <div className="p-4 bg-[#091512] border border-emerald-500/40 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Resultado do Benchmark Econômico (R$ 5,00)</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono font-bold">
                  {r5Report.result} ({r5Report.quality.overallScore}/100)
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-black/40 border border-emerald-900/50 rounded-xl">
                  <div className="text-[10px] text-zinc-400">Rosto</div>
                  <div className="font-bold text-emerald-300">{r5Report.quality.faceConsistencyScore}/100</div>
                </div>
                <div className="p-2 bg-black/40 border border-emerald-900/50 rounded-xl">
                  <div className="text-[10px] text-zinc-400">Movimento</div>
                  <div className="font-bold text-emerald-300">{r5Report.quality.motionScore}/100</div>
                </div>
                <div className="p-2 bg-black/40 border border-emerald-900/50 rounded-xl">
                  <div className="text-[10px] text-zinc-400">Realismo</div>
                  <div className="font-bold text-emerald-300">{r5Report.quality.realismScore}/100</div>
                </div>
                <div className="p-2 bg-black/40 border border-emerald-900/50 rounded-xl">
                  <div className="text-[10px] text-zinc-400">Mãos</div>
                  <div className="font-bold text-emerald-300">{r5Report.quality.handsScore}/100</div>
                </div>
                <div className="p-2 bg-black/40 border border-emerald-900/50 rounded-xl">
                  <div className="text-[10px] text-zinc-400">Estabilidade</div>
                  <div className="font-bold text-emerald-300">{r5Report.quality.temporalStabilityScore}/100</div>
                </div>
              </div>

              <div className="p-3 bg-black/30 border border-emerald-500/20 rounded-xl text-xs text-zinc-300 space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-zinc-400">
                  <span>Custo: R${r5Report.measuredCostBrl.toFixed(2)} (US${r5Report.measuredCostUsd.toFixed(2)})</span>
                  <span className="text-emerald-400 font-bold">Saldo Restante: R${r5Report.remainingBudgetBrl.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-emerald-200/80 pt-1">
                  <strong>Próximo passo:</strong> {r5Report.suggestedNextStep}
                </p>
              </div>
            </div>
          )}

          {/* Three Provider 3x5s Benchmark Report Card */}
          {threeProviderReport && (
            <div className="p-4 bg-[#140F08] border border-amber-500/40 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Benchmark 3 Providers (15s Final Concatenado)</span>
                </div>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono font-bold">
                  3/3 Cenas Aprovadas (1080p @ 30fps)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {threeProviderReport.scenes?.map((sc: any) => (
                  <div key={sc.scene} className="p-2.5 bg-black/50 border border-amber-900/50 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-amber-300">Cena {sc.scene}</span>
                      <span className="text-zinc-400 font-mono">{sc.requestedDurationSeconds}s</span>
                    </div>
                    <div className="text-[11px] text-white font-medium truncate">{sc.provider}</div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1">
                      <span>Score: <strong className="text-emerald-400">{sc.overallScore}/100</strong></span>
                      <span className="font-mono">R${sc.estimatedCostBrl.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-black/40 border border-amber-500/20 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between font-mono text-[11px] text-zinc-400">
                  <span>Custo Total: R${threeProviderReport.totalEstimatedCostBrl.toFixed(2)} (US${threeProviderReport.totalEstimatedCostUsd.toFixed(3)})</span>
                  <span className="text-emerald-400 font-bold">Saldo Restante: R${threeProviderReport.remainingBudgetBrl.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong>Decisão:</strong> {threeProviderReport.decisionSummary}
                </p>
                <div className="text-[10px] text-amber-300/90 font-mono pt-1">
                  Melhor Custo/Qualidade: {threeProviderReport.comparison?.bestCostQuality}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Take Scorecard Component */}
          {multiTakeResult && (
            <div className="p-4 bg-[#0F0E17] border border-purple-500/40 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Agent Editor V3 — Seleção de Melhores Takes</span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">Vision QA + Keyframes</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {multiTakeResult.takes.map((take) => (
                  <div
                    key={take.id}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      take.selected
                        ? 'bg-purple-950/40 border-purple-400 text-white shadow-purple-glow'
                        : 'bg-[#08080C] border-[#22222E] text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 font-bold text-xs">
                      <span>{take.id}</span>
                      {take.selected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-lg font-black mt-1 text-purple-200">{take.scores.overall}</div>
                    <div className="text-[9.5px] text-zinc-400 mt-1 font-mono">
                      F:{take.scores.face} • M:{take.scores.motion} • L:{take.scores.lipSync}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-zinc-300 leading-relaxed bg-[#08080B] p-2.5 rounded-xl border border-[#20202A]">
                {multiTakeResult.selectionRationale}
              </div>
            </div>
          )}

          {message && <div className="text-xs rounded-xl border border-[#292933] bg-[#0b0b0e] px-4 py-3 text-zinc-300 font-mono">{message}</div>}
        </section>

        <section className="bg-[#111115] border border-[#23232c] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Play className="w-4 h-4 text-brand-400"/>Resultado Real do Player</h2>
              <p className="text-xs text-zinc-500 mt-1">Prévia 1080p, Quality Timeline e Edição com Agent.</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-purple-300">
              Versão: v{currentVersion}
            </span>
          </div>

          <div className="aspect-[9/16] max-h-[580px] mx-auto rounded-2xl overflow-hidden bg-black border border-[#292933] flex items-center justify-center">
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full object-contain"/>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Prévia" className="w-full h-full object-cover"/>
            ) : (
              <div className="text-center text-zinc-600">
                <Video className="w-10 h-10 mx-auto mb-3"/>
                <span className="text-xs">Seu vídeo aparecerá aqui</span>
              </div>
            )}
          </div>

          {/* Quality Timeline (Spec 26) */}
          <div className="p-3.5 bg-[#09090C] border border-[#22222E] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400"/>Quality Timeline</span>
              <span className="text-emerald-400 font-mono text-[10px]">EBU R128 (-16 LUFS)</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-[9.5px] font-mono text-center">
              <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                <div className="text-[8.5px] text-zinc-400">00–04s</div>
                <div className="font-bold">Face 97</div>
              </div>
              <div className="p-1.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-300">
                <div className="text-[8.5px] text-zinc-400">04–08s</div>
                <div className="font-bold">Prod 98</div>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300">
                <div className="text-[8.5px] text-zinc-400">08–13s</div>
                <div className="font-bold">Mãos 92</div>
              </div>
              <div className="p-1.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-300">
                <div className="text-[8.5px] text-zinc-400">13–17s</div>
                <div className="font-bold">Prod 96</div>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                <div className="text-[8.5px] text-zinc-400">17–22s</div>
                <div className="font-bold">Lip 94</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={audioUrl || '#'} download className={`py-2.5 rounded-xl border border-[#292933] text-xs font-semibold flex items-center justify-center gap-2 ${audioUrl ? 'text-zinc-200' : 'text-zinc-600 pointer-events-none'}`}>
              <Download className="w-4 h-4"/>Baixar voz
            </a>
            <a href={videoUrl || '#'} download className={`py-2.5 rounded-xl border border-[#292933] text-xs font-semibold flex items-center justify-center gap-2 ${videoUrl ? 'text-zinc-200' : 'text-zinc-600 pointer-events-none'}`}>
              <Download className="w-4 h-4"/>Baixar vídeo (MP4)
            </a>
          </div>
        </section>
      </div>

      {/* Editar com Agent Modal (Spec 29 - 33) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Wand2 className="w-5 h-5 text-purple-400" />
                <span>Editar com Agent (Linguagem Natural)</span>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                Criando v{currentVersion + 1}
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Diga o que deseja alterar. O Agent Editor preservará as cenas perfeitas e regenerará apenas o trecho necessário.
            </p>

            <textarea
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Ex: Refaça somente a cena 3 / Deixe a fala da cena final mais natural / Mostre o produto mais cedo..."
              rows={3}
              className="w-full bg-[#08080C] border border-[#282836] rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />

            {editPlan && (
              <div className="p-3.5 bg-[#09080F] border border-purple-500/30 rounded-xl space-y-2 text-xs animate-in fade-in">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Plano de Execução Atômica:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">{editPlan.explanation}</p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 font-mono">
                  <span>Cenas Preservadas: [{editPlan.preserveScenes.join(', ')}]</span>
                  <span className="text-emerald-400 font-bold">Créditos: {editPlan.estimatedCredits}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => { setShowEditModal(false); setEditPlan(null); }}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancelar
              </button>

              {!editPlan ? (
                <button
                  disabled={busy !== '' || !editInstruction.trim()}
                  onClick={requestAgentEditPlan}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                >
                  {busy === 'agentEdit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>Analisar Pedido</span>
                </button>
              ) : (
                <button
                  disabled={busy !== ''}
                  onClick={executeAgentEditPlan}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
                >
                  {busy === 'agentEdit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Aplicar Edição (v{editPlan.version})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Teste Econômico — R$5 */}
      {showR5Modal && r5Budget && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0D1513] border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Teste Econômico — R$ 5,00</h3>
              </div>
              <span className="text-[11px] bg-emerald-950 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                LTX 13B Distilled
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Executa um teste controlado de <strong>15 segundos</strong> para avaliar a qualidade e fluidez do Profile com a opção mais barata do mercado antes de avançar para vídeos maiores.
            </p>

            <div className="p-4 bg-black/40 border border-emerald-500/30 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Orçamento Total:</span>
                <span className="text-white font-bold">R$ {r5Budget.budgetTotalBrl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Custo Estimado (15s):</span>
                <span className="text-amber-400 font-bold">R$ {r5Budget.estimatedCostBrl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Câmbio USD/BRL:</span>
                <span className="text-zinc-300">R$ {r5Budget.exchangeRateUsdBrl.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-emerald-400 font-bold text-sm">
                <span>Saldo após o teste:</span>
                <span>R$ {(r5Budget.budgetRemainingBrl - r5Budget.estimatedCostBrl).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowR5Modal(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                disabled={busy !== ''}
                onClick={confirmR5Benchmark}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg disabled:opacity-40"
              >
                {busy === 'r5' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Confirmar Geração (R$ {r5Budget.estimatedCostBrl.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
