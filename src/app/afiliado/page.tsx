'use client';

import { useState } from 'react';
import { AlertCircle, ArrowRight, Check, ExternalLink, Loader2, PackageSearch, Pencil, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { AffiliateLink, Product, ProductDNA, ProfileProductMatch } from '@/lib/types';

type Analysis = {
  resolved: { platform: string; resolutionSource: string; warnings: string[]; data: Record<string, string | undefined> };
  requiresManualInput?: boolean;
  product?: Product;
  affiliateLink?: AffiliateLink;
  productDNA?: ProductDNA;
  matches?: ProfileProductMatch[];
};

const platformLabels: Record<string, string> = { mercado_livre: 'Mercado Livre', tiktok_shop: 'TikTok Shop', universal: 'Outra plataforma' };

export default function AffiliatePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string>();

  async function analyze() {
    setLoading(true); setError(''); setAnalysis(null);
    try {
      const response = await fetch('/api/affiliate/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não conseguimos analisar este produto.');
      setAnalysis(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Não conseguimos analisar este produto.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-[0.18em] mb-4"><ShoppingBag className="w-4 h-4" /> Afiliado Plataforma</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Venda com Profile Dark</h1>
        <p className="mt-3 text-zinc-400 text-sm sm:text-base">Cole o link do produto que você quer divulgar. Preservamos o link original e usamos apenas dados públicos permitidos.</p>
      </div>

      <section className="mt-8 rounded-2xl border border-[#2A2438] bg-gradient-to-br from-[#15101f] to-[#0d0d12] p-5 sm:p-7 shadow-purple-glow">
        <label htmlFor="affiliate-url" className="text-sm font-semibold text-zinc-200">Link de afiliado</label>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <input id="affiliate-url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && analyze()} placeholder="https://..." className="min-w-0 flex-1 rounded-xl border border-[#302a3d] bg-[#09090d] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          <button onClick={analyze} disabled={loading || !url.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando produto</> : <><PackageSearch className="w-4 h-4" /> Analisar produto</>}
          </button>
        </div>
        {loading && <div className="mt-5 grid sm:grid-cols-4 gap-2 text-xs text-zinc-400">{['Identificando plataforma...', 'Buscando produto...', 'Analisando informações...', 'Preparando estratégia...'].map((step, index) => <div key={step} className={`rounded-lg border px-3 py-2.5 ${index === 0 ? 'border-brand-500/40 bg-brand-500/10 text-brand-200' : 'border-[#24242c] bg-[#111116]'}`}>{step}</div>)}</div>}
        {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
      </section>

      {analysis?.requiresManualInput && <section className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6"><div className="flex gap-3"><AlertCircle className="w-5 h-5 text-amber-400 shrink-0" /><div><h2 className="font-semibold text-white">Precisamos de algumas informações</h2><p className="mt-1 text-sm text-zinc-400">{analysis.resolved.warnings[0]}</p><button disabled title="Editor manual será disponibilizado na próxima etapa" className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-500 cursor-not-allowed">Adicionar manualmente — em implementação</button></div></div></section>}

      {analysis?.product && analysis.productDNA && <>
        <section className="mt-6 grid lg:grid-cols-[260px_1fr] gap-6 rounded-2xl border border-[#24242d] bg-[#101014] p-5 sm:p-6">
          <div className="aspect-square rounded-xl overflow-hidden bg-[#17171d] flex items-center justify-center">{analysis.product.imageUrl ? <img src={analysis.product.imageUrl} alt={analysis.product.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-12 h-12 text-zinc-700" />}</div>
          <div><div className="flex flex-wrap gap-2 mb-3"><span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-300"><Check className="inline w-3 h-3 mr-1" /> Link preservado</span><span className="rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-[11px] text-brand-300">{platformLabels[analysis.resolved.platform] || analysis.resolved.platform}</span></div><h2 className="text-2xl font-bold text-white">{analysis.product.name}</h2><p className="mt-2 text-brand-300 font-semibold">{analysis.product.price || 'Preço não publicado'}</p><p className="mt-4 text-sm leading-6 text-zinc-400">{analysis.product.description}</p><div className="mt-5 flex flex-wrap gap-3"><button disabled title="Edição será habilitada na próxima etapa" className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-500 cursor-not-allowed"><Pencil className="w-3.5 h-3.5" /> Editar informações</button><a href={analysis.product.buyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#302a3d] px-4 py-2 text-xs text-zinc-300 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /> Conferir link original</a></div></div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#24242d] bg-[#101014] p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-400" /><h2 className="text-lg font-bold text-white">Product DNA</h2></div><div className="mt-5 grid md:grid-cols-2 gap-4"><div className="rounded-xl bg-[#0b0b0f] border border-[#202028] p-4"><div className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Dados do produto</div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-zinc-500">Marca</dt><dd className="text-zinc-200">{analysis.productDNA.brand}</dd></div><div><dt className="text-zinc-500">Categoria</dt><dd className="text-zinc-200">{analysis.productDNA.category}</dd></div><div><dt className="text-zinc-500">Preço</dt><dd className="text-zinc-200">{analysis.productDNA.price || 'Não publicado'}</dd></div></dl></div><div className="rounded-xl bg-brand-500/5 border border-brand-500/15 p-4"><div className="text-[11px] font-semibold tracking-wider text-brand-300 uppercase">Análise da IA</div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-zinc-500">Público provável</dt><dd className="text-zinc-200">{analysis.productDNA.targetAudience}</dd></div><div><dt className="text-zinc-500">Desejo associado</dt><dd className="text-zinc-200">{analysis.productDNA.desireExploited}</dd></div><div><dt className="text-zinc-500">Observação</dt><dd className="text-zinc-200">Hipóteses para revisão, não dados da plataforma.</dd></div></dl></div></div></section>

        <section className="mt-6"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold text-white">3 Profiles recomendados</h2><p className="mt-1 text-sm text-zinc-500">Estratégias distintas, avaliadas no contexto do produto.</p></div><span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-500"><ShieldCheck className="w-3.5 h-3.5" /> Fit estimado por IA</span></div><div className="mt-4 grid lg:grid-cols-3 gap-4">{analysis.matches?.map((match) => <article key={match.id} className={`rounded-2xl border p-5 transition ${selectedMatch === match.id ? 'border-brand-500 bg-brand-500/10' : 'border-[#24242d] bg-[#101014] hover:border-[#3a3348]'}`}><div className="flex justify-between gap-3"><div><h3 className="font-bold text-white">{match.name}</h3><p className="text-xs text-zinc-500">{match.age} · {match.archetype}</p></div><div className="text-right"><div className="text-xl font-bold text-brand-300">{match.fitScore}</div><div className="text-[9px] text-zinc-600 uppercase">Fit IA</div></div></div><p className="mt-4 text-sm text-zinc-300">{match.contentStyle}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{match.rationale}</p><button onClick={() => setSelectedMatch(match.id)} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1b1722] border border-[#302a3d] px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 hover:border-brand-500">{selectedMatch === match.id ? <><Check className="w-3.5 h-3.5" /> Profile escolhido</> : <>Escolher este Profile <ArrowRight className="w-3.5 h-3.5" /></>}</button></article>)}</div>{selectedMatch && <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-sm text-brand-200">Profile selecionado. O próximo passo será abrir o builder com os dados deste produto já preenchidos.</div>}</section>
      </>}
    </div>
  );
}
