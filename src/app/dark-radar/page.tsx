'use client';

import { useState } from 'react';
import { Check, Flame, PlusCircle } from 'lucide-react';
import { PROFILE_ARCHETYPES, dnaFromArchetype } from '@/lib/profile-archetypes';

export default function DarkRadarPage() {
  const [category,setCategory]=useState('Todos');
  const [status,setStatus]=useState<{type:'success'|'error';text:string}|null>(null);
  const [saving,setSaving]=useState<string>();
  const categories=['Todos',...Array.from(new Set(PROFILE_ARCHETYPES.map(item=>item.kind==='animal'?'Animais':item.kind==='personagem_original'?'Personagens originais':item.niche.split(' & ')[0])) )];
  const items=PROFILE_ARCHETYPES.filter(item=>category==='Todos'||(category==='Animais'&&item.kind==='animal')||(category==='Personagens originais'&&item.kind==='personagem_original')||item.niche.startsWith(category));

  async function create(archetype:typeof PROFILE_ARCHETYPES[number]) {
    setSaving(archetype.id); setStatus(null);
    const dna=dnaFromArchetype(archetype,'produtos compatíveis com sua especialidade',archetype.audience);
    try {
      const response=await fetch('/api/profiles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:archetype.name,avatarUrl:archetype.avatarUrl,bio:`${archetype.role} — ${archetype.expertise}.`,niche:archetype.niche,personality:archetype.personality,toneOfVoice:archetype.tone,voiceName:`${archetype.name.split(' ')[0]} (Natural)`,realismScore:0,dna,references:[],characterLock:{face:false,age:false,hair:false,body:false,voice:false,personality:false}})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'Não foi possível criar o Profile.');
      setStatus({type:'success',text:`${archetype.name} foi criado com DNA profissional completo.`});
    } catch(error) { setStatus({type:'error',text:error instanceof Error?error.message:'Não foi possível criar o Profile.'}); }
    finally { setSaving(undefined); }
  }

  return <div className="p-5 sm:p-8 space-y-6">
    <div><h1 className="text-xl font-bold text-white flex items-center gap-2"><Flame className="w-5 h-5 text-amber-400"/>Dark Radar — catálogo profissional</h1><p className="mt-1 text-xs text-zinc-400">Arquétipos editoriais originais com profissão, experiência, padrão de fala e estratégia comercial definidos. Os scores de mercado dependem de dados conectados e não são inventados.</p></div>
    {status&&<div role="status" className={`rounded-xl border px-4 py-3 text-sm ${status.type==='success'?'border-emerald-500/25 bg-emerald-500/10 text-emerald-200':'border-red-500/25 bg-red-500/10 text-red-200'}`}>{status.text}</div>}
    <div className="flex gap-2 overflow-x-auto pb-2">{categories.map(item=><button key={item} onClick={()=>setCategory(item)} className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold ${category===item?'bg-brand-600 text-white':'border border-[#292933] bg-[#141418] text-zinc-400'}`}>{item}</button>)}</div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-[#24242d] bg-[#111116] flex flex-col"><img src={item.avatarUrl} alt={item.name} className="h-44 w-full object-cover"/><div className="p-5 flex-1 flex flex-col"><div className="text-[10px] uppercase tracking-wider text-brand-300">{item.role} · {item.age} anos</div><h2 className="mt-1 text-lg font-bold text-white">{item.name}</h2><p className="mt-2 text-xs leading-5 text-zinc-400">{item.expertise}</p><div className="mt-3 rounded-xl bg-[#0b0b0f] p-3 text-[11px] leading-5 text-zinc-300"><strong className="text-white">Personalidade:</strong> {item.personality}<br/><strong className="text-white">Fala:</strong> {item.speechPattern}<br/><strong className="text-white">Conteúdo:</strong> {item.contentStyle}</div><div className="mt-3 flex flex-wrap gap-1">{item.tags.slice(0,5).map(tag=><span key={tag} className="rounded-full bg-brand-500/10 px-2 py-1 text-[9px] text-brand-200">{tag}</span>)}</div><button onClick={()=>create(item)} disabled={saving===item.id} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving===item.id?<><Check className="w-4 h-4"/>Criando...</>:<><PlusCircle className="w-4 h-4"/>Criar este Profile</>}</button></div></article>)}</div>
  </div>;
}
