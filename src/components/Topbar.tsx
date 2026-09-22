import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';

export function Topbar({ onMenu, title, subtitle, actions }: { onMenu: () => void; title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { staff } = useAuth();
  const { notifications } = useData();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden w-9 h-9 grid place-items-center rounded-lg border border-slate-200"><Menu size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[17px] sm:text-[19px] text-slate-900 truncate">{title}</h1>
          {subtitle && <div className="text-[11.5px] text-slate-500 truncate">{subtitle}</div>}
        </div>
        <div className="hidden md:flex relative">
          <input className="input input-sm w-[220px] pl-9" placeholder="Search…" />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {actions}
        <Link to="/notifications" className="relative w-9 h-9 grid place-items-center rounded-lg border border-slate-200 hover:bg-slate-50">
          <Bell size={16} />
          {unread > 0 && <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-red-500 text-white rounded-full min-w-[16px] h-4 grid place-items-center px-1">{unread}</span>}
        </Link>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 text-white grid place-items-center font-bold text-[11px]">
            {staff?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'U'}
          </div>
          <div className="hidden md:block">
            <div className="text-[12px] font-semibold leading-tight">{staff?.name}</div>
            <div className="text-[10.5px] text-slate-500">{staff?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
