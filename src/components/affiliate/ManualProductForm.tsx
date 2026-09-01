'use client';

import { useState } from 'react';
import { AlertCircle, Check, Loader2, Pencil } from 'lucide-react';

type Props = { affiliateUrl:string; onCompleted:(analysis:any)=>void };

export function ManualProductForm({ affiliateUrl, onCompleted }: Props) {
  const [name,setName]=useState('');
  const [brand,setBrand]=useState('');
  const [category,setCategory]=useState('');
  const [price,setPrice]=useState('');
  const [imageUrl,setImageUrl]=useState('');
  const [description,setDescription]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  async function submit(event:React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response=await fetch('/api/affiliate/manual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({affiliateUrl,name,brand,category,price,imageUrl,description})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || 'Não foi possível salvar o produto.');
      onCompleted(data);
    } catch(err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar o produto.'); }
    finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="mt-4 rounded-2xl border border-brand-500/20 bg-[#101014] p-5 sm:p-6 space-y-4">
    <div className="flex items-start gap-3"><Pencil className="w-5 h-5 text-brand-400 mt-0.5"/><div><h2 className="font-semibold text-white">Complete os dados do produto</h2><p className="mt-1 text-xs text-zinc-500">Use o título e as informações exibidas na página oficial. O link afiliado original continuará intacto.</p></div></div>
    <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs text-zinc-300 sm:col-span-2">Nome completo do produto *<input value={name} onChange={e=>setName(e.target.value)} required minLength={3} className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#09090d] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" /></label><label className="text-xs text-zinc-300">Marca<input value={brand} onChange={e=>setBrand(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#09090d] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" /></label><label className="text-xs text-zinc-300">Categoria *<input value={category} onChange={e=>setCategory(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#09090d] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" /></label><label className="text-xs text-zinc-300">Preço exibido<input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Ex: R$ 89,90" className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#09090d] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" /></label><label className="text-xs text-zinc-300">URL da imagem oficial<input type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..." className="mt-1.5 w-full rounded-xl border border-[#292933] bg-[#09090d] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" /></label><label className="text-xs text-zinc-300 sm:col-span-2">Descrição e características principais *<textarea value={description} onChange={e=>setDescription(e.target.value)} required minLength={20} rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-[#292933] bg-[#09090d] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500" /></label></div>
    {error&&<div role="alert" className="flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-200"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
    <button type="submit" disabled={saving} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{saving?<><Loader2 className="w-4 h-4 animate-spin"/>Salvando produto...</>:<><Check className="w-4 h-4"/>Salvar e sugerir Profiles</>}</button>
  </form>;
}
