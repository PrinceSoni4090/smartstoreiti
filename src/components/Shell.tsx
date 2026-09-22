import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Shell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-[var(--color-paper)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setOpen(true)} title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto animate-in">{children}</main>
      </div>
    </div>
  );
}
