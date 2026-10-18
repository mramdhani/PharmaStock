import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 w-full">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center mb-3 text-slate-400 shadow-sm">
        <Icon className="w-7 h-7 text-slate-400 stroke-[1.75]" />
      </div>
      <p className="text-sm font-bold text-slate-800 tracking-tight">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
