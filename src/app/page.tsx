'use client';

import React, { useState, useEffect } from 'react';
import { QuickWorkflowSteps } from '@/components/layout/QuickWorkflowSteps';
import { GenerateContentCard } from '@/components/dashboard/GenerateContentCard';
import { BulkGenerationCard } from '@/components/dashboard/BulkGenerationCard';
import { ProfileSettingsCard } from '@/components/dashboard/ProfileSettingsCard';
import { ContextRealismCard, DEFAULT_GENERATION_SETTINGS, GenerationSettings } from '@/components/dashboard/ContextRealismCard';
import { RenderQueueCard } from '@/components/dashboard/RenderQueueCard';
import { RecentLibraryCard } from '@/components/dashboard/RecentLibraryCard';

import { QuickTipsWidget } from '@/components/dashboard/QuickTipsWidget';
import { BestPracticesWidget } from '@/components/dashboard/BestPracticesWidget';
import { SystemHealthWidget } from '@/components/dashboard/SystemHealthWidget';
import { NeedHelpWidget } from '@/components/dashboard/NeedHelpWidget';

import { CreateProfileModal } from '@/components/modals/CreateProfileModal';
import { NewGenerationModal } from '@/components/modals/NewGenerationModal';
import { PromptEnhancerModal } from '@/components/modals/PromptEnhancerModal';
import { CreativePlanModal } from '@/components/modals/CreativePlanModal';
import { Video3sTestModal } from '@/components/modals/Video3sTestModal';
import { DownloadPackageModal } from '@/components/modals/DownloadPackageModal';
import { SystemDoctorModal } from '@/components/modals/SystemDoctorModal';

import { Profile, Product, GenerationJob, MediaLibraryItem, CreativePlan, QualityCheck } from '@/lib/types';
import { PromptEnhanceResult } from '@/lib/ai/prompt-enhancer';
import {
  INITIAL_PROFILES,
  INITIAL_PRODUCTS,
} from '@/lib/constants';

export default function DashboardPage() {
  // Data State
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<Profile>(INITIAL_PROFILES[0]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(DEFAULT_GENERATION_SETTINGS);
  const [operationMessage, setOperationMessage] = useState<{type:'success'|'error'|'info';text:string}|null>(null);

  // Modals State
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isNewGenerationOpen, setIsNewGenerationOpen] = useState(false);
  const [isPromptEnhancerOpen, setIsPromptEnhancerOpen] = useState(false);
  const [promptEnhanceResult, setPromptEnhanceResult] = useState<PromptEnhanceResult | null>(null);

  const [isCreativePlanOpen, setIsCreativePlanOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<CreativePlan | null>(null);

  const [isVideo3sOpen, setIsVideo3sOpen] = useState(false);
  const [active3sJob, setActive3sJob] = useState<GenerationJob | null>(null);
  const [activeQualityCheck, setActiveQualityCheck] = useState<QualityCheck | null>(null);

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadTargetItem, setDownloadTargetItem] = useState<GenerationJob | MediaLibraryItem | null>(null);

  const [isSystemDoctorOpen, setIsSystemDoctorOpen] = useState(false);

  // Sync state from server on mount
  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((data) => {
        if (data.profiles && data.profiles.length > 0) {
          setProfiles(data.profiles);
          setSelectedProfile(data.profiles[0]);
        }
      })
      .catch(() => {});

    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {});

    fetch('/api/render-jobs')
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs.filter((job:GenerationJob)=>!job.isDemo));
      })
      .catch(() => {});
    fetch('/api/library').then((r)=>r.json()).then((data)=>{if(data.items)setLibraryItems(data.items.filter((item:MediaLibraryItem)=>!item.isDemo));}).catch(()=>{});
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('pd-generation-settings');
    if (saved) try { setGenerationSettings({ ...DEFAULT_GENERATION_SETTINGS, ...JSON.parse(saved) }); } catch { /* use safe defaults */ }
  }, []);

  const updateGenerationSettings = (next:GenerationSettings) => {
    setGenerationSettings(next);
    window.localStorage.setItem('pd-generation-settings', JSON.stringify(next));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('newGeneration') === '1') setIsNewGenerationOpen(true);
  }, []);

  // Listen to Global Custom Events from Header
  useEffect(() => {
    const handleOpenCreateProfile = () => setIsCreateProfileOpen(true);
    const handleOpenNewGeneration = () => setIsNewGenerationOpen(true);

    window.addEventListener('open-create-profile', handleOpenCreateProfile);
    window.addEventListener('open-new-generation', handleOpenNewGeneration);

    return () => {
      window.removeEventListener('open-create-profile', handleOpenCreateProfile);
      window.removeEventListener('open-new-generation', handleOpenNewGeneration);
    };
  }, []);

  // Handlers
  const handleProfileCreated = (newProfile: Profile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    setSelectedProfile(newProfile);
  };

  const handleTriggerBulk = async (quantity: number, format: 'reels' | 'shorts' | 'tiktok', variations: string[]) => {
    try {
      const res = await fetch('/api/generate/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          productId: products[0]?.id,
          quantity,
          format,
          variations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar a geração em massa.');
      if (data.jobs) {
        setJobs((prev) => [...data.jobs, ...prev]);
        setOperationMessage({type:'success',text:`${quantity} vídeos adicionados à fila.`});
      }
    } catch (e) {
      setOperationMessage({type:'error',text:e instanceof Error?e.message:'Erro ao disparar geração em massa.'});
    }
  };

  const handleRun3sTest = async (profile: Profile, product?: Product) => {
    try {
      const res = await fetch('/api/generate/test-3s', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          productId: product?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível executar o teste de 3 segundos.');
      if (data.job) {
        setActive3sJob(data.job);
        setActiveQualityCheck(data.qualityCheck);
        setIsVideo3sOpen(true);
        setJobs((prev) => [data.job, ...prev]);
      }
    } catch (e) {
      setOperationMessage({type:'error',text:e instanceof Error?e.message:'Erro ao executar o teste de 3 segundos.'});
    }
  };

  const handleStartJob = async (plan: CreativePlan, profile: Profile, product?: Product) => {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          productId: product?.id,
          creativePlan: {...plan, fullScript:`${plan.fullScript}\n\n[DIREÇÃO DE PRODUÇÃO]\nRealismo: ${generationSettings.realismLevel}%. Estilo: ${generationSettings.visualStyle}. Cenário: ${generationSettings.backgroundScene}. Contexto original: ${generationSettings.keepContext?'preservar':'adaptar'}. Produto: ${generationSettings.preserveProduct?'preservar fielmente':'adaptação permitida'}. Legendas: ${generationSettings.autoCaptions?'ativadas':'desativadas'}. Marca d’água: ${generationSettings.showWatermark?'ativada':'desativada'}.`},
          resolution: generationSettings.renderQuality.startsWith('4K') ? '4k' : generationSettings.renderQuality.startsWith('720') ? '720p' : '1080p',
          fps: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível iniciar o render.');
      if (data.job) {
        setJobs((prev) => [data.job, ...prev]);
        setOperationMessage({type:'success',text:`Renderização iniciada: “${data.job.title}”.`});
      }
    } catch (e) {
      setOperationMessage({type:'error',text:e instanceof Error?e.message:'Erro ao iniciar job de renderização.'});
    }
  };

  const handleViewJob = async (job: GenerationJob) => {
    if (job.isSmokeTest || job.status === 'concluido') {
      setActive3sJob(job);
      const response=await fetch(`/api/quality-check?jobId=${encodeURIComponent(job.id)}`);
      const data=await response.json();
      setActiveQualityCheck(data.qualityCheck || null);
      setIsVideo3sOpen(true);
    } else {
      setOperationMessage({type:'info',text:`“${job.title}”: ${job.status} (${job.progress}%).`});
    }
  };

  const handleDownloadJob = (job: GenerationJob | MediaLibraryItem) => {
    setDownloadTargetItem(job);
    setIsDownloadOpen(true);
  };

  return (
    <div className="p-5 sm:p-8 space-y-6">
      {operationMessage && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${operationMessage.type==='error'?'border-red-500/25 bg-red-500/10 text-red-200':operationMessage.type==='success'?'border-emerald-500/25 bg-emerald-500/10 text-emerald-200':'border-brand-500/25 bg-brand-500/10 text-brand-200'}`}>{operationMessage.text}</div>}
      {/* 1. Quick Workflow Banner */}
      <QuickWorkflowSteps />

      {/* Main Grid: 2 Columns (Center Content + Right Widgets) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Center Main Area: 9 Columns */}
        <div className="col-span-12 xl:col-span-9 space-y-6">
          {/* Row 1: 3 Cards */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            <GenerateContentCard
              contentUrl={contentUrl}
              onChangeContentUrl={setContentUrl}
              onOpenPromptModal={() => setIsNewGenerationOpen(true)}
            />
            <BulkGenerationCard />
            <ProfileSettingsCard
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelectProfile={setSelectedProfile}
              onEditProfile={() => {
                window.location.href = '/profiles';
              }}
            />
          </div>

          {/* Row 2: 2 Cards (Context & Realism + Render Queue) */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-5">
              <ContextRealismCard value={generationSettings} onChange={updateGenerationSettings} />
            </div>
            <div className="col-span-12 lg:col-span-7">
              <RenderQueueCard
                jobs={jobs}
                onViewJob={handleViewJob}
                onDownloadJob={handleDownloadJob}
              />
            </div>
          </div>

          {/* Row 3: Recent Library (Card 6) */}
          <div>
            <RecentLibraryCard
              items={libraryItems}
              onPreviewItem={(item) => {
                setActive3sJob({
                  id: item.id,
                  title: item.title,
                  profileId: 'prof_1',
                  profileName: item.profileName,
                  profileAvatarUrl: item.profileAvatarUrl,
                  status: 'concluido',
                  progress: 100,
                  durationSeconds: 24,
                  resolution: '1080p',
                  aspectRatio: '9:16',
                  fps: 30,
                  videoUrl: item.videoUrl,
                  thumbnailUrl: item.thumbnailUrl,
                  pipeline: [],
                  costCredits: 80,
                  retryCount: 0,
                  createdAt: item.createdAt,
                });
                setIsVideo3sOpen(true);
              }}
              onDownloadItem={handleDownloadJob}
            />
          </div>
        </div>

        {/* Right Column Widgets: 3 Columns */}
        <div className="col-span-12 xl:col-span-3 grid sm:grid-cols-2 xl:grid-cols-1 gap-5 content-start">
          <QuickTipsWidget />
          <BestPracticesWidget />
          <SystemHealthWidget
            onOpenSystemDoctor={() => setIsSystemDoctorOpen(true)}
          />
          <NeedHelpWidget />
        </div>
      </div>

      {/* --- Interactive Modals --- */}
      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        onProfileCreated={handleProfileCreated}
      />

      <NewGenerationModal
        isOpen={isNewGenerationOpen}
        onClose={() => setIsNewGenerationOpen(false)}
        profiles={profiles}
        products={products}
        selectedProfile={selectedProfile}
        onSelectProfile={setSelectedProfile}
        onRun3sTest={(prof, prod) => handleRun3sTest(prof, prod)}
        onStartJob={(plan, prof, prod) => handleStartJob(plan, prof, prod)}
        onOpenPromptEnhancer={(res) => {
          setPromptEnhanceResult(res);
          setIsPromptEnhancerOpen(true);
        }}
        initialContentUrl={contentUrl}
      />

      <PromptEnhancerModal
        isOpen={isPromptEnhancerOpen}
        onClose={() => setIsPromptEnhancerOpen(false)}
        enhanceResult={promptEnhanceResult}
        onApplyEnhanced={(enhanced) => {
          navigator.clipboard.writeText(enhanced);
          setOperationMessage({type:'success',text:'Prompt otimizado copiado. Cole-o no briefing para revisar antes de gerar.'});
        }}
      />

      <CreativePlanModal
        isOpen={isCreativePlanOpen}
        onClose={() => setIsCreativePlanOpen(false)}
        plan={activePlan}
        profile={selectedProfile}
        product={products[0]}
        onRun3sTest={() => handleRun3sTest(selectedProfile, products[0])}
        onApproveAndRender={() => {
          if (activePlan) handleStartJob(activePlan, selectedProfile, products[0]);
        }}
      />

      <Video3sTestModal
        isOpen={isVideo3sOpen}
        onClose={() => setIsVideo3sOpen(false)}
        job={active3sJob}
        qualityCheck={activeQualityCheck}
        onRetest={() => {
          if (selectedProfile) handleRun3sTest(selectedProfile, products[0]);
        }}
        onGenerateFullVideo={() => {
          if (active3sJob?.creativePlan) handleStartJob({...active3sJob.creativePlan,targetDurationSeconds:24},selectedProfile,products[0]);
        }}
        onAutoFix={async (jobId) => { const response=await fetch(`/api/render-jobs/${jobId}/scene-retry`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sceneNumber:1})}); const data=await response.json(); setOperationMessage({type:response.ok?'success':'error',text:response.ok?'Cena enviada para nova geração.':data.error||'Não foi possível corrigir a cena.'}); }}
      />

      <DownloadPackageModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        item={downloadTargetItem}
      />

      <SystemDoctorModal
        isOpen={isSystemDoctorOpen}
        onClose={() => setIsSystemDoctorOpen(false)}
      />
    </div>
  );
}
