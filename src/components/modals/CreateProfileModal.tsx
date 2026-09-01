'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, User, Flame, Link2, Check, Copy, CheckCheck, Camera } from 'lucide-react';
import { Profile } from '@/lib/types';
import { RealismEngine } from '@/lib/ai/realism-engine';
import { dnaFromArchetype, PROFILE_ARCHETYPES, ProfileArchetype, rankArchetypes } from '@/lib/profile-archetypes';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreated: (profile: Profile) => void;
  initialProduct?: string;
  initialArchetype?: string;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileCreated,
  initialProduct,
  initialArchetype,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'radar' | 'url'>('ai');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // AI Form state
  const [whatToSell, setWhatToSell] = useState(initialProduct || '');
  const [targetAudience, setTargetAudience] = useState('');
  const [profileVibe, setProfileVibe] = useState('');
  const [country, setCountry] = useState('Brasil');

  // Manual Form state
  const [manualName, setManualName] = useState('');
  const [manualNiche, setManualNiche] = useState('Profissões & Vida Real');
  const [manualPersonality, setManualPersonality] = useState('');
  const [manualExpertise, setManualExpertise] = useState('');
  const [manualAudience, setManualAudience] = useState('');

  // Preview state
  const [generatedProfile, setGeneratedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (initialProduct) setWhatToSell(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    if (!initialArchetype) return;
    const archetype = PROFILE_ARCHETYPES.find((item) => item.id === initialArchetype);
    if (!archetype) return;
    setTargetAudience(archetype.audience);
    setProfileVibe(`${archetype.role}; ${archetype.personality}. Tom: ${archetype.tone}.`);
  }, [initialArchetype]);

  if (!isOpen) return null;

  const persistProfile = async (profile: Profile) => {
    setIsSaving(true);
    setSaveError('');
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok || !data.profile) throw new Error(data.error || 'Não foi possível salvar o Profile.');
      onProfileCreated(data.profile);
      onClose();
      return data.profile as Profile;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o Profile.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateWithAI = () => {
    setSaveError('');
    if (!whatToSell.trim() || !targetAudience.trim()) {
      setSaveError('Informe o produto ou serviço e o público-alvo para receber uma recomendação profissional.');
      return;
    }
    const archetype = PROFILE_ARCHETYPES.find((item) => item.id === initialArchetype) || rankArchetypes(`${whatToSell} ${targetAudience} ${profileVibe}`, 1)[0];
      const profileDna = dnaFromArchetype(archetype, whatToSell, targetAudience);
      profileDna.personality = `${archetype.personality}. Direção solicitada: ${profileVibe}.`;
      profileDna.nationality = country.startsWith('Brasil') ? 'Brasileiro(a)' : country;
      const masterPromptData = RealismEngine.buildMasterImagePrompt(profileDna);
      profileDna.imageGenerationPrompt = masterPromptData.prompt;
      profileDna.masterNegativePrompt = masterPromptData.negativePrompt;

      const newProf: Profile = {
        id: `prof_${Date.now()}`,
        name: archetype.name,
        avatarUrl: archetype.avatarUrl,
        bio: `${archetype.role} — ${archetype.expertise}.`,
        niche: archetype.niche,
        personality: archetype.personality,
        toneOfVoice: archetype.tone,
        voiceName: `${archetype.name.split(' ')[0]} (Natural)`,
        realismScore: 0,
        language: 'Português (BR)',
        characterLock: {
          face: false,
          age: false,
          hair: false,
          body: false,
          voice: false,
          personality: false,
        },
        dna: profileDna,
        references: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setGeneratedProfile(newProf);
  };

  const handleSelectRadarConcept = async (archetype: ProfileArchetype) => {
    const dna = dnaFromArchetype(archetype, whatToSell, targetAudience);
    const promptData = RealismEngine.buildMasterImagePrompt(dna);
    dna.imageGenerationPrompt = promptData.prompt;
    dna.masterNegativePrompt = promptData.negativePrompt;
    const now = new Date().toISOString();
    await persistProfile({
      id: `prof_${Date.now()}`, name: archetype.name, avatarUrl: archetype.avatarUrl,
      bio: `${archetype.role} — ${archetype.expertise}.`, niche: archetype.niche,
      personality: archetype.personality, toneOfVoice: archetype.tone,
      voiceName: `${archetype.name.split(' ')[0]} (Natural)`, realismScore: 0,
      language: 'Português (BR)', characterLock: { face: false, age: false, hair: false, body: false, voice: false, personality: false },
      dna, references: [], createdAt: now, updatedAt: now,
    });
  };

  const handleCopyPrompt = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleSaveGenerated = async () => {
    if (generatedProfile) {
      await persistProfile(generatedProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111115] border border-[#23232C] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Como você quer começar?
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Crie personagens virtuais hiper-realistas com DNA comercial e prompts de consistência.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Selection */}
        <div className="grid grid-cols-4 border-b border-[#1E1E26] bg-[#0C0C0F]">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'ai'
                ? 'border-brand-500 text-brand-400 bg-[#161324]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar assistido</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'manual'
                ? 'border-brand-500 text-brand-400 bg-[#161324]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Manualmente</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'radar'
                ? 'border-brand-500 text-brand-400 bg-[#161324]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Dark Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'url'
                ? 'border-brand-500 text-brand-400 bg-[#161324]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Importar URL</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tab 1: AI Profile Builder */}
          {activeTab === 'ai' && !generatedProfile && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1">
                  O que você quer vender?
                </label>
                <input
                  type="text"
                  value={whatToSell}
                  onChange={(e) => setWhatToSell(e.target.value)}
                  placeholder="Ex: Cosméticos premium, tênis de corrida, assessoria..."
                  className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1">
                  Para quem? (Público-alvo / Persona)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Mulheres de 25-40 anos que buscam autocuidado..."
                  className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    Que tipo de Profile você imagina?
                  </label>
                  <input
                    type="text"
                    value={profileVibe}
                    onChange={(e) => setProfileVibe(e.target.value)}
                    placeholder="Ex: Mulher sofisticada e acolhedora..."
                    className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    País / Idioma
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full py-2 px-2.5 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option>Brasil (pt-BR)</option>
                    <option>Estados Unidos (en-US)</option>
                    <option>Espanha (es-ES)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateWithAI}
                  disabled={!whatToSell.trim() || !targetAudience.trim()}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-purple-glow transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Montar Profile profissional</span>
                </button>
              </div>
            </div>
          )}

          {/* AI Generated Preview with Gemini / ChatGPT Consistency Prompt */}
          {activeTab === 'ai' && generatedProfile && (
            <div className="space-y-4">
              <div className="p-4 bg-[#15151B] border border-[#2A2A36] rounded-xl flex items-start gap-4">
                <img
                  src={generatedProfile.avatarUrl}
                  alt={generatedProfile.name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-brand-500"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      {generatedProfile.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                      {generatedProfile.realismScore > 0 ? `Realismo: ${generatedProfile.realismScore}%` : 'Aguardando imagem mestre'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {generatedProfile.dna.personality}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {generatedProfile.dna.suggestedUsernames.slice(0, 3).map((u) => (
                      <span key={u} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* SPECIAL HIGHLIGHTED BOX: Master Image Consistency Prompt for Gemini / ChatGPT */}
              <div className="p-4 bg-[#181328] border border-brand-500/50 rounded-xl space-y-2 shadow-purple-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-300 text-xs font-bold">
                    <Camera className="w-4 h-4 text-brand-400" />
                    <span>Prompt Mestre para Geração no Gemini / ChatGPT / Midjourney</span>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyPrompt(
                        generatedProfile.dna.imageGenerationPrompt ||
                          RealismEngine.buildMasterImagePrompt(generatedProfile.dna).prompt
                      )
                    }
                    className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copiedPrompt ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span>✓ Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Prompt Mestre</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10.5px] text-zinc-400">
                  Use este prompt no <strong>Google Gemini</strong>, <strong>ChatGPT (DALL-E 3)</strong>, <strong>FLUX</strong> ou <strong>Midjourney</strong> para gerar imagens idênticas sem variações de traços ou idade.
                </p>

                <div className="p-3 bg-[#0B0A12] border border-brand-500/30 rounded-lg text-[11px] font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {generatedProfile.dna.imageGenerationPrompt ||
                    RealismEngine.buildMasterImagePrompt(generatedProfile.dna).prompt}
                </div>
              </div>

              {/* DNA Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#0D0D10] p-3 rounded-xl border border-[#1E1E26]">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Voz & Tom:</span>
                  <span className="text-zinc-200 font-medium">{generatedProfile.dna.toneOfVoice}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Estratégia de Venda:</span>
                  <span className="text-zinc-200 font-medium">{generatedProfile.dna.salesStyle}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 block text-[10px]">CTA Principal:</span>
                  <span className="text-brand-300 font-medium">&quot;{generatedProfile.dna.mainCTA}&quot;</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setGeneratedProfile(null)}
                  className="py-2.5 px-4 bg-[#181820] hover:bg-[#22222E] border border-[#272734] rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Regenerar
                </button>
                <button
                  onClick={handleSaveGenerated}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-purple-glow transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando no Profile Dark...' : 'Aprovar & Salvar Profile'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Dark Radar Instant Selection */}
          {activeTab === 'radar' && (
            <div className="space-y-2.5">
              <p className="text-xs text-zinc-400 mb-2">
                Selecione um conceito com alto potencial comercial validado pelo Dark Radar:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {PROFILE_ARCHETYPES.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectRadarConcept(c)}
                    className="p-3 bg-[#131318] hover:bg-[#1A1A22] border border-[#22222C] hover:border-brand-500/50 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <img src={c.avatarUrl} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-amber-400 font-medium">
                        {c.role} • {c.kind === 'pessoa' ? `${c.age} anos` : c.kind === 'animal' ? 'Personagem animal' : 'Ficção original'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Manual */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-200 block mb-1">Nome do Personagem</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: Sophia Albuquerque"
                  className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">Nicho</label>
                  <select
                    value={manualNiche}
                    onChange={(e) => setManualNiche(e.target.value)}
                    className="w-full py-2 px-2.5 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option>Lifestyle & Beleza</option>
                    <option>Tecnologia & Automotivo</option>
                    <option>Esportes & Fitness</option>
                    <option>Gastronomia</option>
                    <option>Finanças & Negócios</option>
                    <option>Construção & Ferramentas</option>
                    <option>Automotivo & Oficina</option>
                    <option>Vendas & Consórcios</option>
                    <option>Pets & Animais</option>
                    <option>Humor & Memes</option>
                    <option>Profissões & Vida Real</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">Personalidade</label>
                  <input
                    type="text"
                    value={manualPersonality}
                    onChange={(e) => setManualPersonality(e.target.value)}
                    placeholder="Ex: Confiante e Empática"
                    className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">Experiência comprovável</label>
                  <input value={manualExpertise} onChange={(e)=>setManualExpertise(e.target.value)} placeholder="Ex: 12 anos vendendo consórcios" className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">Público-alvo</label>
                  <input value={manualAudience} onChange={(e)=>setManualAudience(e.target.value)} placeholder="Ex: Famílias planejando o primeiro carro" className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!manualName.trim() || !manualPersonality.trim() || !manualExpertise.trim() || !manualAudience.trim()) { setSaveError('Preencha nome, personalidade, experiência e público-alvo. Um Profile profissional não pode nascer genérico.'); return; }
                  const base=rankArchetypes(`${manualNiche} ${manualExpertise} ${manualAudience}`,1)[0];
                  const manualDna=dnaFromArchetype(base,manualNiche,manualAudience);
                  manualDna.name=manualName.trim(); manualDna.personality=manualPersonality.trim();
                  const pData = RealismEngine.buildMasterImagePrompt(manualDna);
                  manualDna.imageGenerationPrompt=pData.prompt; manualDna.masterNegativePrompt=pData.negativePrompt;

                  const p: Profile = {
                    id: `prof_${Date.now()}`,
                    name: manualName,
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                    bio: `${manualExpertise.trim()}. ${manualPersonality.trim()}`,
                    niche: manualNiche,
                    personality: manualPersonality,
                    toneOfVoice: base.tone,
                    voiceName: `${manualName.split(' ')[0]} (Natural)`,
                    realismScore: 0,
                    language: 'Português (BR)',
                    characterLock: { face: false, age: false, hair: false, body: false, voice: false, personality: false },
                    dna: manualDna,
                    references: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  await persistProfile(p);
                }}
                disabled={isSaving}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl mt-2"
              >
                {isSaving ? 'Salvando...' : 'Salvar Profile Manual'}
              </button>
            </div>
          )}

          {/* Tab 4: URL Import */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-snug">
                Insira a URL pública de uma conta de referência (Instagram, TikTok ou YouTube). A IA fará a análise heurística de estilo e perfil sem solicitar senhas.
              </p>
              <input
                type="text"
                placeholder="https://instagram.com/perfil_de_exemplo"
                className="w-full py-2 px-3 bg-[#0D0D10] border border-[#262630] rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <button
                disabled
                title="A importação de redes sociais exige conexão oficial da conta"
                className="w-full py-2.5 bg-zinc-800 text-zinc-500 font-bold text-xs rounded-xl cursor-not-allowed"
              >
                Conecte a conta em Integrações para importar
              </button>
            </div>
          )}
        </div>
        {saveError && <div role="alert" className="mx-6 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">{saveError}</div>}
      </div>
    </div>
  );
};
