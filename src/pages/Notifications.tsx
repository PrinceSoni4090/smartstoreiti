import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { fmtDateTime, relTime } from '../lib/format';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { notifications, refreshNotifications } = useData();
  const nav = useNavigate();

  const markRead = async (id: number) => {
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await refreshNotifications();
  };
  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    await fetch('/api/notifications', { method: 'DELETE' });
    await refreshNotifications();
  };

  return (
    <Shell title="Notification Center" subtitle="Approval alerts, low-stock warnings and system events"
      actions={<button onClick={clearAll} className="btn btn-ghost h-9 text-[12.5px]"><Trash2 size={14} />Clear All</button>}>
      <div className="card p-4">
        <div className="grid gap-2">
          {notifications.map((n) => (
            <div key={n.id} className={`flex gap-3 p-3 rounded-xl border ${n.read ? 'bg-white border-slate-200' : 'bg-blue-50/60 border-blue-200'}`}>
              <div className="w-10 h-10 rounded-full bg-white border grid place-items-center"><Bell size={16} className="text-blue-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-[13px]">{n.title}</span>
                  <span className="text-[10.5px] text-slate-400 whitespace-nowrap">{relTime(n.created_at)}</span>
                </div>
                <div className="text-[12.5px] text-slate-600 mt-1">{n.message}</div>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className="badge badge-slate">{n.type}</span>
                  <span className="badge badge-blue">{n.for_role}</span>
                  <span className="text-[10.5px] text-slate-400">{fmtDateTime(n.created_at)}</span>
                  <button onClick={() => nav(`/${n.link}`)} className="text-[11px] font-bold text-blue-700 ml-auto">Go →</button>
                </div>
              </div>
              {!n.read && (
                <button onClick={() => markRead(n.id)} className="w-9 h-9 grid place-items-center rounded-lg border bg-white hover:bg-slate-50" title="Mark read"><Check size={14} /></button>
              )}
            </div>
          ))}
          {notifications.length === 0 && <div className="text-center py-16 text-slate-400">No notifications</div>}
        </div>
      </div>
    </Shell>
  );
}
