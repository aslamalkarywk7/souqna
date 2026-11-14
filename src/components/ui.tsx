import {Loader2, PackageSearch} from 'lucide-react';
import type {ReactNode} from 'react';

export function Spinner({label}: {label?: string}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <Loader2 size={32} className="animate-spin text-brand-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({title, sub, action}: {title: string; sub?: string; action?: ReactNode}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <span className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
        <PackageSearch size={30} />
      </span>
      <h3 className="font-bold text-slate-700">{title}</h3>
      {sub && <p className="text-sm text-slate-400 max-w-sm">{sub}</p>}
      {action}
    </div>
  );
}

export function Badge({tone, children}: {tone: 'green' | 'amber' | 'red' | 'blue' | 'gray'; children: ReactNode}) {
  const tones: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-brand-50 text-brand-700 ring-brand-200',
    gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}
