import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, FileText, ArrowLeftRight, ShoppingCart, Wrench, ClipboardCheck, BookOpen, BarChart3, Bell, Users, ShieldCheck, Settings, LogOut, Undo2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ACCESS } from '../lib/rbac';
import { statusBadge } from '../lib/format';
import { GovtEmblem, ItiLogo, SkillIndia } from './GovLogo';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Main' },
  { key: 'inventory', label: 'Inventory & Items', icon: Package, section: 'Operations' },
  { key: 'requisition', label: 'Material Requisitions', icon: ClipboardList, section: 'Operations' },
  { key: 'issue', label: 'Issue Slips', icon: FileText, section: 'Operations' },
  { key: 'return', label: 'Returns', icon: Undo2, section: 'Operations' },
  { key: 'transfer', label: 'Stock Transfers', icon: ArrowLeftRight, section: 'Operations' },
  { key: 'procurement', label: 'Procurement / PO', icon: ShoppingCart, section: 'Operations' },
  { key: 'assets', label: 'Assets & Tools', icon: Wrench, section: 'Operations' },
  { key: 'verification', label: 'Stock Verification', icon: ClipboardCheck, section: 'Compliance' },
  { key: 'registers', label: 'Registers (16)', icon: BookOpen, section: 'Compliance' },
  { key: 'reports', label: 'Reports & Exports', icon: BarChart3, section: 'Compliance' },
  { key: 'audit', label: 'Audit Trail', icon: ShieldCheck, section: 'Compliance' },
  { key: 'notifications', label: 'Notifications', icon: Bell, section: 'System' },
  { key: 'users', label: 'User Management', icon: Users, section: 'System' },
  { key: 'settings', label: 'Settings', icon: Settings, section: 'System' },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { staff, role, signOut } = useAuth();
  const allowed = role ? NAV_ACCESS[role] : [];

  const grouped = NAV_ITEMS.filter(i => allowed.includes(i.key)).reduce<Record<string, typeof NAV_ITEMS>>((acc, i) => {
    acc[i.section] = acc[i.section] || [];
    acc[i.section].push(i);
    return acc;
  }, {});

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-slate-900/40 lg:hidden ${open ? '' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed lg:static z-50 top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200">
          {/* Three official logos lockup */}
          <div className="flex items-center justify-around gap-2 pb-3 mb-3 border-b border-slate-100">
            <GovtEmblem size={34} />
            <ItiLogo size={34} />
            <SkillIndia size={26} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] text-white grid place-items-center font-bold text-[10px] leading-tight text-center">ITI<br/>RG</div>
            <div className="min-w-0">
              <div className="font-bold text-[13px] text-slate-900 leading-tight truncate">Govt ITI Raigarh</div>
              <div className="text-[10.5px] text-slate-500 leading-tight">Smart Store Mgmt System</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 text-white grid place-items-center font-bold text-[11px]">
              {staff?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold text-slate-900 truncate">{staff?.name}</div>
              <div className="text-[10.5px]"><span className={statusBadge(staff?.role || '')}>{staff?.role}</span></div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="sidebar-section">{section}</div>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.key} to={`/${item.key}`} onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Icon size={16} strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-200">
          <button onClick={signOut} className="sidebar-link text-red-600 hover:bg-red-50 w-full">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <div className="mt-2 text-[10px] text-slate-400 text-center">v2.0 • FY 2025-26</div>
        </div>
      </aside>
    </>
  );
}
