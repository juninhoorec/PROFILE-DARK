'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Bell, Menu, X, Home, Users, ShoppingBag, Film, Radar } from 'lucide-react';

interface HeaderProps {
  onOpenCreateProfile?: () => void;
  onOpenNewGeneration?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateProfile,
  onOpenNewGeneration,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileLinks = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/profiles', label: 'Profiles', icon: Users },
    { href: '/afiliado', label: 'Afiliado', icon: ShoppingBag },
    { href: '/render-center', label: 'Renderizações', icon: Film },
    { href: '/dark-radar', label: 'Dark Radar', icon: Radar },
  ];
  return (
    <header className="h-16 px-4 sm:px-8 border-b border-[#1A1A1E] bg-[#09090B]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 relative">
      {/* Welcome Title */}
      <div className="min-w-0">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          Bem-vindo, Pedro! <span className="text-sm">👋</span>
        </h1>
        <p className="text-xs text-zinc-400 truncate hidden sm:block">
          Pronto para criar conteúdos incríveis com IA.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMenuOpen((open) => !open)} className="lg:hidden w-9 h-9 rounded-lg bg-[#141418] border border-[#27272A] flex items-center justify-center text-zinc-200" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>{menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}</button>
        {/* Create Profile Button */}
        <Link
          href="/profiles?create=1"
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-all shadow-purple-glow hover:shadow-brand-glow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar novo Profile</span>
        </Link>

        {/* New Generation Button */}
        <Link
          href="/?newGeneration=1"
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1C1C22] border border-[#27272A] text-xs font-medium text-zinc-200 hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Nova geração</span>
        </Link>

        {/* Notifications */}
        <button disabled title="Notificações estarão disponíveis após conectar uma conta" className="w-8 h-8 rounded-lg bg-[#141418] border border-[#27272A] flex items-center justify-center text-zinc-600 cursor-not-allowed relative">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-500" />
        </button>

        {/* User Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#27272A]">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
            alt="Pedro Martins"
            className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
          />
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-zinc-200 leading-none">
              Pedro Martins
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">
              Modo Grátis
            </div>
          </div>
        </div>
      </div>
      {menuOpen && <nav className="absolute left-3 right-3 top-[58px] lg:hidden rounded-xl border border-[#2b2634] bg-[#111116] p-2 shadow-2xl">{mobileLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-brand-500/10 hover:text-white"><Icon className="w-4 h-4 text-brand-400" />{label}</Link>)}</nav>}
    </header>
  );
};
