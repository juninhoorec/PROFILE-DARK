'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  PlusCircle,
  Sliders,
  FolderOpen,
  Film,
  Download,
  Calendar,
  BarChart3,
  Plug,
  Settings,
  ChevronDown,
  Sparkles,
  Zap,
  ShoppingBag,
  Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onOpenCreateProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateProfile }) => {
  const pathname = usePathname();

  const mainNavItems = [
    { label: 'Início', href: '/', icon: Home },
    { label: 'Profiles', href: '/profiles', icon: Users },
    { label: 'Afiliado Plataforma', href: '/afiliado', icon: ShoppingBag },
    {
      label: 'Criar Profile',
      href: '#',
      icon: PlusCircle,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenCreateProfile?.();
      },
    },
    { label: 'Geração em Massa', href: '/geracao-em-massa', icon: Sliders },
    { label: 'Biblioteca', href: '/biblioteca', icon: FolderOpen },
    { label: 'Renderizações', href: '/render-center', icon: Film },
    { label: 'Downloads', href: '/downloads', icon: Download },
    { label: 'Calendário', href: '/calendario', icon: Calendar },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Dark Radar', href: '/dark-radar', icon: Radar },
  ];

  const secondaryNavItems = [
    { label: 'Integrações', href: '/integracoes', icon: Plug },
    { label: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0B0B0E] border-r border-[#1E1E22] flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 pb-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 flex items-center justify-center shadow-purple-glow">
            <span className="font-extrabold text-white text-base tracking-wider">P</span>
          </div>
          <div>
            <span className="font-bold text-white tracking-wide text-sm flex items-center gap-1.5">
              PROFILE DARK
            </span>
            <span className="text-[10px] text-brand-400 font-medium tracking-wider uppercase block">
              AI Sales Engine
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* Main Section */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href) && item.href !== '#';
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative group',
                  isActive
                    ? 'bg-[#1e1435] text-white font-semibold shadow-sm border border-brand-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#141417]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-brand-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-brand-400 shadow-purple-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider & Secondary Section */}
        <div className="pt-2 border-t border-[#1C1C20] space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative group',
                  isActive
                    ? 'bg-[#1e1435] text-white font-semibold border border-brand-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#141417]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-brand-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Plan card + User info */}
      <div className="p-3 space-y-2 border-t border-[#1C1C20] bg-[#09090B]/60">
        {/* Pro Plan Card */}
        <div className="bg-[#141418] border border-[#232328] rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Plano Pro
            </span>
            <button className="px-2 py-0.5 rounded-md bg-brand-600 hover:bg-brand-500 text-[10px] font-semibold text-white transition-colors shadow-sm">
              Upgrade
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400">Créditos restantes</span>
              <span className="font-semibold text-zinc-200">
                12.450 <span className="text-zinc-500 font-normal">/ 20.000</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full"
                style={{ width: '62%' }}
              />
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 text-right">
            Renova em 10/06/2026
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#141418] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
              alt="Pedro Martins"
              className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
            />
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Pedro Martins
              </div>
              <div className="text-[10px] text-zinc-500 truncate max-w-[110px]">
                pedro@email.com
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </div>
      </div>
    </aside>
  );
};
