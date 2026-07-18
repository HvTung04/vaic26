import type { ReactNode } from 'react';

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
