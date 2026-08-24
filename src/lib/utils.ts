import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'concluido':
    case 'completed':
    case 'passed':
      return { label: 'Concluído', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'renderizando':
      return { label: 'Renderizando', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400 animate-pulse' };
    case 'gerando_video':
      return { label: 'Gerando vídeo', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' };
    case 'gerando_roteiro':
      return { label: 'Gerando roteiro', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' };
    case 'preparando':
      return { label: 'Preparando', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' };
    case 'aguardando':
      return { label: 'Aguardando', bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', dot: 'bg-zinc-400' };
    case 'needs_review':
      return { label: 'Revisão Necessária', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'falhou':
    case 'failed':
      return { label: 'Falhou', bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' };
    case 'cancelado':
      return { label: 'Cancelado', bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', dot: 'bg-zinc-500' };
    default:
      return { label: status, bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-300', dot: 'bg-zinc-400' };
  }
}
