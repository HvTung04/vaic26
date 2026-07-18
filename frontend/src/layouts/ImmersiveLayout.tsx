import type { ReactNode } from 'react';

export interface ImmersiveLayoutProps {
  children: ReactNode;
}

export function ImmersiveLayout({ children }: ImmersiveLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-cream text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">{children}</div>
    </div>
  );
}
