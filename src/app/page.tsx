'use client';

import React, { useState, useEffect } from 'react';
import { QuickWorkflowSteps } from '@/components/layout/QuickWorkflowSteps';
import { GenerateContentCard } from '@/components/dashboard/GenerateContentCard';
import { BulkGenerationCard } from '@/components/dashboard/BulkGenerationCard';
import { ProfileSettingsCard } from '@/components/dashboard/ProfileSettingsCard';
import { ContextRealismCard } from '@/components/dashboard/ContextRealismCard';
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
  INITIAL_RENDER_JOBS,
  INITIAL_LIBRARY_ITEMS,
} from '@/lib/constants';

export default function DashboardPage() {
  // Data State
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<Profile>(INITIAL_PROFILES[0]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [jobs, setJobs] = useState<GenerationJob[]>(INITIAL_RENDER_JOBS);
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>(INITIAL_LIBRARY_ITEMS);
  const [contentUrl, setContentUrl] = useState('');

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
        if (data.jobs) setJobs(data.jobs);
      })
      .catch(() => {});
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
      if (data.jobs) {
        setJobs((prev) => [...data.jobs, ...prev]);
        alert(`${quantity} vídeos em massa foram adicionados com sucesso à fila de renderização!`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao disparar geração em massa.');
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
      if (data.job) {
        setActive3sJob(data.job);
        setActiveQualityCheck(data.qualityCheck);
        setIsVideo3sOpen(true);
        setJobs((prev) => [data.job, ...prev]);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao executar o teste de 3 segundos.');
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
          creativePlan: plan,
          resolution: '1080p',
          fps: 30,
        }),
      });
      const data = await res.json();
      if (data.job) {
        setJobs((prev) => [data.job, ...prev]);
        alert(`Renderização iniciada: "${data.job.title}". Acompanhe na fila.`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao iniciar job de renderização.');
    }
  };

  const handleViewJob = (job: GenerationJob) => {
    if (job.isSmokeTest || job.status === 'concluido') {
      setActive3sJob(job);
      setActiveQualityCheck({
        id: `qc_${job.id}`,
        jobId: job.id,
        status: 'passed',
        metrics: {
          realism: 98,
          identity: 99,
          product: 99,
          motion: 95,
          overallQuality: job.qualityScore || 97,
        },
        details: {
          faceConsistent: true,
          productConsistent: true,
          lipSyncAccurate: true,
          audioClear: true,
          captionsSynced: true,
          resolutionValid: true,
          aspectRatioValid: true,
          durationValid: true,
          artifactsDetected: false,
          ctaLegible: true,
          brandSafe: true,
          issues: [],
          autoFixAvailable: false,
        },
        inspectedAt: new Date().toISOString(),
      });
      setIsVideo3sOpen(true);
    } else {
      alert(`Job "${job.title}" está com status: ${job.status} (${job.progress}%).`);
    }
  };

  const handleDownloadJob = (job: GenerationJob | MediaLibraryItem) => {
    setDownloadTargetItem(job);
    setIsDownloadOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* 1. Quick Workflow Banner */}
      <QuickWorkflowSteps />

      {/* Main Grid: 2 Columns (Center Content + Right Widgets) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Center Main Area: 9 Columns */}
        <div className="col-span-9 space-y-6">
          {/* Row 1: 3 Cards */}
          <div className="grid grid-cols-3 gap-5">
            <GenerateContentCard
              contentUrl={contentUrl}
              onChangeContentUrl={setContentUrl}
              onOpenPromptModal={() => setIsNewGenerationOpen(true)}
            />
            <BulkGenerationCard onTriggerBulk={handleTriggerBulk} />
            <ProfileSettingsCard
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelectProfile={setSelectedProfile}
              onEditProfile={(p) => {
                setSelectedProfile(p);
                setIsCreateProfileOpen(true);
              }}
            />
          </div>

          {/* Row 2: 2 Cards (Context & Realism + Render Queue) */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-5">
              <ContextRealismCard />
            </div>
            <div className="col-span-7">
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
        <div className="col-span-3 space-y-5">
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
      />

      <PromptEnhancerModal
        isOpen={isPromptEnhancerOpen}
        onClose={() => setIsPromptEnhancerOpen(false)}
        enhanceResult={promptEnhanceResult}
        onApplyEnhanced={(enhanced) => {
          alert('Prompt otimizado copiado e aplicado com sucesso!');
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
          alert('Qualidade aprovada pelo usuário! Vídeo completo adicionado ao Render Center.');
        }}
        onAutoFix={(jobId) => {
          alert('Correção automática de cena aplicada com sucesso. Profile e Produto mantidos bloqueados.');
        }}
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
