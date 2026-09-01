'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Check, Clock3, Hash, Image as ImageIcon, Loader2, RefreshCw, Rocket, ShieldCheck, Sparkles, Video } from 'lucide-react';
import type { Product, Profile } from '@/lib/types';
import type { SocialMediaAsset, SocialPlatform, SocialPost, SocialTrendSnapshot } from '@/lib/social/types';
import type { CommerceProductLink } from '@/lib/social/product-catalog';

type Dashboard = {
  profiles: Profile[];
  products: Product[];
  commerceProducts: CommerceProductLink[];
  mediaProductLinks: Record<string, string>;
  media: SocialMediaAsset[];
  posts: SocialPost[];
  trends: SocialTrendSnapshot;
  unmappedFolders: string[];
  connections: Array<{ platform: SocialPlatform; connected: boolean; mode: string }>;
};

const PLATFORM: Record<SocialPlatform, { name: string; icon: string; color: string }> = {
  instagram: { name: 'Instagram', icon: '📸', color: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' },
  youtube: { name: 'YouTube', icon: '▶️', color: 'border-red-400/30 bg-red-400/10 text-red-200' },
  shopee: { name: 'Shopee', icon: '🛍️', color: 'border-orange-400/30 bg-orange-400/10 text-orange-200' },
  mercado_livre: { name: 'Mercado Livre', icon: '🤝', color: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200' },
};

const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(value));
const timeLabel = (value: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export default function CalendarioPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [profileId, setProfileId] = useState('all');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/social', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar a central social.');
    setDashboard(data);
  }

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => { load().catch(() => undefined); }, 5 * 60 * 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const posts = useMemo(() => dashboard?.posts.filter((post) => profileId === 'all' || post.profileId === profileId) || [], [dashboard, profileId]);
  const grouped = useMemo(() => posts.reduce<Record<string, SocialPost[]>>((result, post) => {
    const key = post.scheduledAt.slice(0, 10);
    (result[key] ||= []).push(post);
    return result;
  }, {}), [posts]);
  const selectedProfile = dashboard?.profiles.find((profile) => profile.id === profileId);
  const profileMedia = dashboard?.media.filter((media) => profileId === 'all' || media.profileId === profileId) || [];
  const associatedMedia = profileMedia.filter((media) => dashboard?.mediaProductLinks[media.id]).length;

  async function action(payload: object, label: string) {
    setBusy(label); setMessage('');
    try {
      const response = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.dashboard) setDashboard(data.dashboard); else await load();
      setMessage(label === 'plan' ? 'Sprint inteligente de 14 dias preparada. Revise e aprove as publicações.' : 'Central atualizada com segurança.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'A operação não foi concluída.'); }
    finally { setBusy(''); }
  }

  return <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-[1600px] mx-auto">
    <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-brand-300"><Rocket className="w-4 h-4"/>Central de crescimento</div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Calendário inteligente de 14 dias</h1>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-400">Organiza as mídias de cada perfil, adapta legenda e hashtags por plataforma e aprende com métricas oficiais quando as contas forem conectadas.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="min-w-56 rounded-xl border border-white/10 bg-[#101014] px-3 py-2.5 text-xs text-white">
          <option value="all">Todos os perfis</option>
          {dashboard?.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
        </select>
        <button onClick={() => action({ action: 'generate_plan', profileId: profileId === 'all' ? undefined : profileId }, 'plan')} disabled={Boolean(busy) || !dashboard} className="rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2">{busy === 'plan' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}Preparar sprint de 14 dias</button>
      </div>
    </header>

    <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <Metric icon={<Video className="w-4 h-4"/>} label="Mídias encontradas" value={String(profileMedia.length)} detail={`${profileMedia.filter((item) => item.kind === 'video').length} vídeos · ${profileMedia.filter((item) => item.kind === 'image').length} imagens`}/>
      <Metric icon={<CalendarDays className="w-4 h-4"/>} label="Publicações planejadas" value={String(posts.length)} detail={`${posts.filter((post) => post.status === 'approved').length} aprovadas`}/>
      <Metric icon={<Clock3 className="w-4 h-4"/>} label="Radar de horários" value="5 horas" detail={`Próxima leitura ${dashboard ? timeLabel(dashboard.trends.nextRefreshAt) : '—'}`}/>
      <Metric icon={<BarChart3 className="w-4 h-4"/>} label="Estratégia" value="14 dias" detail="Alcance, vínculo, autoridade e conversão"/>
    </section>

    <section className="grid lg:grid-cols-[1fr_auto] gap-3 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400/8 to-transparent p-4">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 w-5 h-5 shrink-0 text-emerald-400"/><div><h2 className="text-sm font-bold text-white">Inteligência honesta, sem números inventados</h2><p className="mt-1 text-[11px] leading-5 text-zinc-400">Enquanto as contas não estiverem conectadas, o PD usa janelas-base e hashtags relevantes ao nicho. Depois do OAuth, substitui estimativas por retenção, visualizações, cliques e horários reais dos seus próprios posts.</p></div></div>
      <button onClick={() => action({ action: 'refresh_intelligence' }, 'refresh')} disabled={Boolean(busy)} className="h-10 self-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 text-xs font-bold text-emerald-200 flex items-center justify-center gap-2 disabled:opacity-40"><RefreshCw className={`w-4 h-4 ${busy === 'refresh' ? 'animate-spin' : ''}`}/>Atualizar agora</button>
    </section>

    {message && <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 px-4 py-3 text-xs text-brand-200">{message}</div>}
    {dashboard?.unmappedFolders.length ? <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-xs text-amber-100">Pasta sem perfil correspondente: <strong>{dashboard.unmappedFolders.join(', ')}</strong>. As mídias foram preservadas, mas ainda não entram no cronograma.</div> : null}
    {dashboard ? <div className="grid sm:grid-cols-2 gap-3"><div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-100"><strong>{associatedMedia}</strong> mídias com produto e link de compra confirmados.</div><div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-100"><strong>{profileMedia.length - associatedMedia}</strong> mídias sem associação segura · <strong>{dashboard.commerceProducts.filter((item) => item.status === 'needs_identification').length}</strong> links aguardando nome do produto.</div></div> : null}

    <section className="grid xl:grid-cols-[1fr_330px] gap-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-white">Linha editorial</h2><p className="text-[10px] text-zinc-500">{selectedProfile ? `Plano exclusivo de ${selectedProfile.name}` : 'Todos os perfis com acervo identificado'}</p></div><div className="text-[10px] text-zinc-500">Horário de Brasília</div></div>
        {!posts.length ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#111115] px-6 py-16 text-center"><CalendarDays className="mx-auto w-8 h-8 text-zinc-700"/><div className="mt-3 text-sm font-semibold text-zinc-300">Cronograma pronto para ser montado</div><p className="mt-1 text-xs text-zinc-500">Clique em “Preparar sprint de 14 dias”. Nada será publicado sem aprovação e conexão oficial.</p></div> :
          <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-3">{Object.entries(grouped).slice(0, 14).map(([day, dayPosts]) => <div key={day} className="rounded-2xl border border-[#24242d] bg-[#111115] p-3.5 min-h-52"><div className="flex items-center justify-between border-b border-white/5 pb-2"><span className="text-xs font-bold capitalize text-zinc-200">{dateLabel(`${day}T12:00:00`)}</span><span className="text-[9px] text-zinc-600">{dayPosts.length} post</span></div><div className="mt-3 space-y-2">{dayPosts.map((post) => {
            const media = dashboard?.media.find((item) => item.id === post.mediaId);
            const platform = PLATFORM[post.platform];
            return <article key={post.id} className="rounded-xl border border-white/8 bg-black/20 p-2.5"><div className="flex gap-2.5">{media ? media.kind === 'video' ? <video src={media.url} muted preload="metadata" className="h-16 w-12 shrink-0 rounded-lg bg-black object-cover"/> : <img src={media.url} alt="" className="h-16 w-12 shrink-0 rounded-lg bg-black object-cover"/> : <div className="h-16 w-12 rounded-lg bg-white/5"/>}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${platform.color}`}>{platform.icon} {platform.name}</span><span className="text-[9px] text-zinc-500">{timeLabel(post.scheduledAt)}</span></div><div className="mt-1.5 truncate text-[10px] font-semibold text-white">{post.profileName}</div><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-zinc-400">{post.caption}</p></div></div>{post.shoppingUrl ? <a href={post.shoppingUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate rounded-lg bg-emerald-400/8 px-2 py-1.5 text-[9px] text-emerald-300">✓ Compra na {post.purchasePlacement === 'pinned_comment' ? 'mensagem fixada' : 'descrição'} · {post.purchaseText}</a> : <div className="mt-2 rounded-lg bg-amber-400/8 px-2 py-1.5 text-[9px] text-amber-200">⚠ Produto ainda não associado a esta mídia</div>}<div className="mt-2 flex items-center justify-between"><span className="text-[9px] capitalize text-zinc-500">{post.objective}</span><button onClick={() => action({ action: 'update_post', id: post.id, update: { status: post.status === 'approved' ? 'draft' : 'approved' } }, `post-${post.id}`)} className={`rounded-lg px-2 py-1 text-[9px] font-bold ${post.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-zinc-400 hover:text-white'}`}>{post.status === 'approved' ? '✓ Aprovado' : 'Aprovar'}</button></div></article>;
          })}</div></div>)}</div>}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-[#24242d] bg-[#111115] p-4"><h2 className="text-xs font-bold text-white">Produtos por mídia</h2><p className="mt-1 text-[9px] leading-4 text-zinc-500">O PD só recomenda uma compra depois desta associação. Selecione um perfil acima para revisar menos itens.</p><div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">{profileMedia.map((media) => <div key={media.id} className="rounded-xl border border-white/5 bg-black/20 p-2.5"><div className="truncate text-[9px] font-semibold text-zinc-300">{media.fileName}</div><select value={dashboard?.mediaProductLinks[media.id] || ''} onChange={(event) => action({ action: 'associate_media', mediaId: media.id, productLinkId: event.target.value || undefined }, `media-${media.id}`)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0b0b0e] px-2 py-1.5 text-[9px] text-zinc-300"><option value="">Sem produto associado</option>{dashboard?.commerceProducts.filter((item) => item.status === 'verified').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>)}</div></div>
        <div className="rounded-2xl border border-[#24242d] bg-[#111115] p-4"><div className="flex items-center gap-2"><Hash className="w-4 h-4 text-brand-300"/><h2 className="text-xs font-bold text-white">Sinais por plataforma</h2></div><div className="mt-3 space-y-3">{dashboard?.connections.map((connection) => { const info = PLATFORM[connection.platform]; const signal = dashboard.trends.platformSignals[connection.platform]; return <div key={connection.platform} className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="flex items-center justify-between"><span className="text-[11px] font-bold text-zinc-200">{info.icon} {info.name}</span><span className="text-[9px] text-amber-300">{connection.connected ? 'Conectado' : connection.mode === 'pacote_pronto' ? 'Pacote pronto' : 'Aguardando OAuth'}</span></div><div className="mt-2 text-[9px] text-zinc-500">Janelas-base: {signal.peakHours.join(' · ')}</div><div className="mt-1 text-[9px] text-zinc-500">Hashtags: {signal.recommendedHashtagCount || 'não aplicável'}</div></div>; })}</div></div>
        <div className="rounded-2xl border border-[#24242d] bg-[#111115] p-4"><div className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-cyan-300"/><h2 className="text-xs font-bold text-white">Acervo por perfil</h2></div><div className="mt-3 space-y-2">{dashboard?.profiles.map((profile) => { const count = dashboard.media.filter((media) => media.profileId === profile.id); if (!count.length) return null; return <button key={profile.id} onClick={() => setProfileId(profile.id)} className="w-full rounded-xl border border-white/5 bg-black/20 p-2.5 text-left hover:border-brand-400/25"><div className="flex items-center justify-between"><span className="truncate text-[10px] font-semibold text-zinc-200">{profile.name}</span><span className="text-[9px] text-zinc-500">{count.length}</span></div><div className="mt-1 text-[9px] text-zinc-600">{count.filter((media) => media.kind === 'video').length} vídeos · {count.filter((media) => media.kind === 'image').length} imagens</div></button>; })}</div></div>
      </aside>
    </section>
  </div>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#24242d] bg-[#111115] p-4"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{icon}{label}</div><div className="mt-2 text-2xl font-bold text-white">{value}</div><div className="mt-1 text-[10px] text-zinc-500">{detail}</div></div>;
}
