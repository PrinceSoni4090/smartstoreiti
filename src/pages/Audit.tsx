import { useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { fmtDateTime } from '../lib/format';
import { Search, ShieldCheck, Download } from 'lucide-react';

export default function Audit() {
  const { audit } = useData();
  const [q, setQ] = useState('');
  const [mod, setMod] = useState('');

  const filtered = useMemo(() => audit.filter((a) => {
    if (mod && a.module !== mod) return false;
    if (q) { const s = q.toLowerCase(); if (!(a.action.toLowerCase().includes(s) || a.module.toLowerCase().includes(s) || (a.user_name || '').toLowerCase().includes(s))) return false; }
    return true;
  }), [audit, q, mod]);

  const modules = [...new Set(audit.map((a) => a.module))];

  const exportCSV = () => {
    const rows = [['Time', 'User', 'Action', 'Module', 'Record', 'IP'], ...filtered.map((a) => [fmtDateTime(a.created_at), a.user_name, a.action, a.module, a.record_id, a.ip])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audit-log.csv'; a.click();
  };

  return (
    <Shell title="Audit Trail" subtitle="Immutable log of every system action · IP + user tracked"
      actions={<button onClick={exportCSV} className="btn btn-ghost h-9 text-[12.5px]"><Download size={14} />Export</button>}>
      <div className="card p-3 flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]"><input className="input input-sm pl-9" placeholder="Search action, module, user…" value={q} onChange={(e) => setQ(e.target.value)} /><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
        <select className="input input-sm w-[200px]" value={mod} onChange={(e) => setMod(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Record</th><th>IP</th><th>Details</th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="text-[11.5px] whitespace-nowrap">{fmtDateTime(a.created_at)}</td>
                <td><div className="font-semibold">{a.user_name}</div><div className="text-[10px] text-slate-400 font-mono">{a.user_id}</div></td>
                <td><span className="badge badge-blue"><ShieldCheck size={9} className="mr-1" />{a.action}</span></td>
                <td>{a.module}</td>
                <td className="font-mono text-[10.5px] text-slate-500">{a.record_id}</td>
                <td className="font-mono text-[10.5px] text-slate-500">{a.ip}</td>
                <td className="text-[10.5px] max-w-[260px] truncate text-slate-500">{a.new_value ? JSON.stringify(a.new_value).slice(0, 100) : '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No audit entries</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
