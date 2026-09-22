import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export function Modal({ open, onClose, title, subtitle, size = 'md', children, footer }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const maxW = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[92vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-[16px] text-slate-900">{title}</h3>
            {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto scroll-thin flex-1">{children}</div>
        {footer && <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
