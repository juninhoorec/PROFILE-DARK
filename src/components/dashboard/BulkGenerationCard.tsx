'use client';

import Link from 'next/link';
import { Layers3, ShieldCheck, Sparkles } from 'lucide-react';

export const BulkGenerationCard = () => <div className="bg-[#121215] border border-[#1F1F26] rounded-2xl p-4 flex flex-col justify-between h-[360px] shadow-subtle">
  <div><h3 className="text-xs font-bold text-white tracking-wide">2. Geração em massa</h3><p className="mt-1 text-[10.5px] leading-4 text-zinc-400">Monte e valide gratuitamente a matriz de variações.</p><div className="mt-5 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4"><Layers3 className="w-7 h-7 text-brand-400"/><h4 className="mt-3 text-sm font-bold text-white">Matriz anti-spam</h4><ul className="mt-3 space-y-2 text-[11px] text-zinc-300"><li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0"/>Até 20 assinaturas únicas</li><li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0"/>Hook, roteiro, cenário, CTA e enquadramento</li><li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0"/>Bloqueio automático de combinações repetitivas</li></ul></div></div><div><Link href="/geracao-em-massa" className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-purple-glow"><Sparkles className="w-4 h-4"/>Abrir geração gratuita</Link><p className="mt-2 text-center text-[10px] text-zinc-500">Sem cobrança: preparação local e filas gratuitas.</p></div>
</div>;
