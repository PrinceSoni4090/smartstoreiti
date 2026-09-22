import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { fmtDateTime, statusBadge } from '../lib/format';
import { Users as UsersIcon, ShieldAlert } from 'lucide-react';

export default function Users() {
  const { staff, departments, trades } = useData();
  const { role } = useAuth();
  if (role !== 'Super Admin') {
    return (
      <Shell title="User Management" subtitle="Restricted">
        <div className="card p-10 text-center">
          <ShieldAlert size={32} className="mx-auto text-red-500" />
          <div className="mt-2 font-bold text-slate-700">Access Denied</div>
          <div className="text-[12.5px] text-slate-500 mt-1">Only Super Admin can manage users.</div>
        </div>
      </Shell>
    );
  }
  return (
    <Shell title="User Management" subtitle={`${staff.length} users · 6 configured roles · RBAC enforced`}>
      <div className="card p-3 mb-4 flex items-center gap-2 text-[12.5px] text-slate-600"><UsersIcon size={14} className="text-blue-700" />Existing staff. Seed users created with Supabase Auth — add new users via Supabase dashboard for now.</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Department / Trade</th><th>Contact</th><th>Status</th><th>Last Login</th></tr></thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id}>
                <td className="font-mono font-bold">{u.username}</td>
                <td><div className="font-semibold">{u.name}</div><div className="text-[11px] text-slate-500">{u.email}</div></td>
                <td><span className={statusBadge(u.role)}>{u.role}</span></td>
                <td className="text-[12px]">{departments.find((d) => d.id === u.dept_id)?.name || '-'}<div className="text-[10.5px] text-slate-500">{trades.find((t) => t.id === u.trade_id)?.name || ''}</div></td>
                <td className="text-[11.5px]">{u.phone}</td>
                <td><span className={statusBadge(u.status)}>{u.status}</span></td>
                <td className="text-[11.5px] text-slate-500">{u.last_login ? fmtDateTime(u.last_login) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
