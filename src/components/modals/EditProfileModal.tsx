'use client';

import { useState } from 'react';
import { AlertCircle, Check, ImagePlus, Save, Trash2, X } from 'lucide-react';
import { Profile, ProfileReference } from '@/lib/types';

type Props = {
  profile: Profile;
  onClose: () => void;
  onUpdated: (profile: Profile) => void;
  onDeleted: (id: string) => void;
};

export function EditProfileModal({ profile, onClose, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState(profile.name);
  const [niche, setNiche] = useState(profile.niche);
  const [personality, setPersonality] = useState(profile.dna.personality);
  const [tone, setTone] = useState(profile.dna.toneOfVoice);
  const [expertise, setExpertise] = useState(profile.bio);
  const [masterUrl, setMasterUrl] = useState(profile.references.find((item) => item.isMaster)?.url || '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true); setError('');
    try {
      let references = profile.references;
      if (masterUrl.trim()) {
        const master: ProfileReference = {
          id: references.find((item) => item.isMaster)?.id || `ref_${crypto.randomUUID()}`,
          url: masterUrl.trim(), type: 'image', isMaster: true, label: 'Imagem mestre', createdAt: new Date().toISOString(),
        };
        references = [...references.filter((item) => !item.isMaster), master];
      }
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, niche, bio: expertise, personality, toneOfVoice: tone, avatarUrl: masterUrl.trim() || profile.avatarUrl, references, characterLock: masterUrl.trim() ? { face:true, age:true, hair:true, body:true, voice:true, personality:true } : profile.characterLock, dna: { name, niche, personality, toneOfVoice: tone } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar o Profile.');
      onUpdated(data.profile); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível atualizar o Profile.'); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/profiles/${profile.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir o Profile.');
      onDeleted(profile.id); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível excluir o Profile.'); setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#2b2b35] bg-[#111115] shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#24242c] bg-[#111115] px-5 py-4"><div><h2 className="font-bold text-white">Editar {profile.name}</h2><p className="text-xs text-zinc-500">Identidade, especialidade e imagem oficial do Profile.</p></div><button onClick={onClose} aria-label="Fechar edição" className="p-2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button></div>
      <div className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs text-zinc-300">Nome<input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#0b0b0f] px-3 py-2.5 text-white outline-none focus:border-brand-500" /></label><label className="text-xs text-zinc-300">Nicho profissional<input value={niche} onChange={(e)=>setNiche(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#0b0b0f] px-3 py-2.5 text-white outline-none focus:border-brand-500" /></label></div>
        <label className="block text-xs text-zinc-300">Experiência e credenciais<textarea value={expertise} onChange={(e)=>setExpertise(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-[#292933] bg-[#0b0b0f] px-3 py-2.5 text-white outline-none focus:border-brand-500" /></label>
        <label className="block text-xs text-zinc-300">Personalidade única<textarea value={personality} onChange={(e)=>setPersonality(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-[#292933] bg-[#0b0b0f] px-3 py-2.5 text-white outline-none focus:border-brand-500" /></label>
        <label className="block text-xs text-zinc-300">Tom e maneira de falar<input value={tone} onChange={(e)=>setTone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#0b0b0f] px-3 py-2.5 text-white outline-none focus:border-brand-500" /></label>
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-white"><ImagePlus className="w-4 h-4 text-brand-400" /> Imagem mestre</div><p className="mt-1 text-xs text-zinc-500">Essa referência passa a ser a identidade visual oficial. O Character Lock só aparece como configurado após salvá-la.</p><input type="url" value={masterUrl} onChange={(e)=>setMasterUrl(e.target.value)} placeholder="https://... imagem de referência" className="mt-3 w-full rounded-xl border border-[#302a3d] bg-[#0b0b0f] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" />{masterUrl && <div className="mt-2 flex items-center gap-2 text-xs text-emerald-300"><Check className="w-3.5 h-3.5" /> Referência pronta para salvar</div>}</div>
        {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      </div>
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#24242c] px-5 py-4"><button onClick={remove} disabled={saving} className={`inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold ${confirmDelete ? 'bg-red-600 text-white' : 'border border-red-500/20 text-red-300 hover:bg-red-500/10'}`}><Trash2 className="w-4 h-4" />{confirmDelete ? 'Clique novamente para excluir' : 'Excluir Profile'}</button><button onClick={save} disabled={saving || name.trim().length < 2} className="inline-flex justify-center items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>
    </div>
  </div>;
}
