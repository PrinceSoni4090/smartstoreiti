import { useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { fmtDate, fmtINR, statusBadge } from '../lib/format';
import { Plus, Search, QrCode, Wrench } from 'lucide-react';
import { can } from '../lib/rbac';
import type { Asset } from '../lib/types';

const empty: Partial<Asset> = { name: '', cat: 'Machinery', make: '', model: '', serial: '', purchase_date: new Date().toISOString().slice(0, 10), cost: 0, warranty_till: '', loc_id: '', dept_id: '', assigned_to: null, condition: 'Good', status: 'Available' };

export default function AssetsPage() {
  const { assets, locations, departments, staff, refresh } = useData();
  const { role } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [edit, setEdit] = useState<Partial<Asset> | null>(null);
  const [qr, setQr] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => assets.filter((a) => {
    if (status && a.status !== status) return false;
    if (q) { const s = q.toLowerCase(); if (!(a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s) || (a.serial || '').toLowerCase().includes(s))) return false; }
    return true;
  }), [assets, q, status]);

  const save = async () => {
    if (!edit?.name) { alert('Name required'); return; }
    setBusy(true);
    try {
      if (edit.id) await fetch('/api/assets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
      else await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
      await refresh();
      setEdit(null);
    } catch { alert('Save failed'); }
    setBusy(false);
  };

  return (
    <Shell title="Assets & Tools Register" subtitle={`${assets.length} tracked assets · Fixed asset register with QR / warranty tracking`}
      actions={can(role!, 'edit', 'assets') ? <button onClick={() => setEdit({ ...empty })} className="btn btn-primary h-9 text-[12.5px]"><Plus size={14} />New Asset</button> : null}
    >
      <div className="card p-3 flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]"><input className="input input-sm pl-9" placeholder="Search code, name, serial…" value={q} onChange={(e) => setQ(e.target.value)} /><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
        <select className="input input-sm w-[150px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option><option>Available</option><option>Assigned</option><option>In Use</option><option>Under Repair</option><option>Damaged</option>
        </select>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="font-mono font-bold text-[11.5px] text-slate-500">{a.code}</div>
                <div className="font-semibold text-[13.5px] text-slate-900 mt-0.5">{a.name}</div>
                <div className="text-[11px] text-slate-500">{a.make} {a.model} • SN: {a.serial}</div>
              </div>
              <span className={statusBadge(a.status)}>{a.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[10px] font-semibold text-slate-500 uppercase">Location</div><div className="text-[12px] font-semibold">{locations.find((l) => l.id === a.loc_id)?.name || '-'}</div></div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[10px] font-semibold text-slate-500 uppercase">Assigned</div><div className="text-[12px] font-semibold">{staff.find((u) => u.id === a.assigned_to)?.name || 'Unassigned'}</div></div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[10px] font-semibold text-slate-500 uppercase">Cost</div><div className="text-[12px] font-semibold">{fmtINR(a.cost)}</div></div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200"><div className="text-[10px] font-semibold text-slate-500 uppercase">Warranty</div><div className="text-[12px] font-semibold">{fmtDate(a.warranty_till)}</div></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setQr(a)} className="btn btn-ghost h-8 text-[11px]"><QrCode size={12} />QR / Tag</button>
              {can(role!, 'edit', 'assets') && <button onClick={() => setEdit(a)} className="btn btn-ghost h-8 text-[11px]"><Wrench size={12} />Edit</button>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full card p-10 text-center text-slate-400">No assets found</div>}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Asset' : 'New Asset'} size="lg" footer={<><button onClick={() => setEdit(null)} className="btn btn-ghost h-9">Cancel</button><button onClick={save} disabled={busy} className="btn btn-primary h-9">{busy ? 'Saving…' : 'Save Asset'}</button></>}>
        {edit && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="text-[11.5px] font-semibold text-slate-600">Asset Name *</label><input className="input mt-1" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Category</label><select className="input mt-1" value={edit.cat || ''} onChange={(e) => setEdit({ ...edit, cat: e.target.value })}><option>Machinery</option><option>IT</option><option>Tools</option><option>Furniture</option></select></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Make</label><input className="input mt-1" value={edit.make || ''} onChange={(e) => setEdit({ ...edit, make: e.target.value })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Model</label><input className="input mt-1" value={edit.model || ''} onChange={(e) => setEdit({ ...edit, model: e.target.value })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Serial No</label><input className="input mt-1" value={edit.serial || ''} onChange={(e) => setEdit({ ...edit, serial: e.target.value })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Purchase Date</label><input type="date" className="input mt-1" value={(edit.purchase_date || '').slice(0, 10)} onChange={(e) => setEdit({ ...edit, purchase_date: e.target.value })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Warranty Till</label><input type="date" className="input mt-1" value={(edit.warranty_till || '').slice(0, 10)} onChange={(e) => setEdit({ ...edit, warranty_till: e.target.value })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Cost (₹)</label><input type="number" className="input mt-1" value={edit.cost || 0} onChange={(e) => setEdit({ ...edit, cost: Number(e.target.value) })} /></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Location</label><select className="input mt-1" value={edit.loc_id || ''} onChange={(e) => setEdit({ ...edit, loc_id: e.target.value })}><option value="">Select…</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Department</label><select className="input mt-1" value={edit.dept_id || ''} onChange={(e) => setEdit({ ...edit, dept_id: e.target.value })}><option value="">Select…</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Assigned To</label><select className="input mt-1" value={edit.assigned_to || ''} onChange={(e) => setEdit({ ...edit, assigned_to: e.target.value || null })}><option value="">Unassigned</option>{staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Condition</label><select className="input mt-1" value={edit.condition || ''} onChange={(e) => setEdit({ ...edit, condition: e.target.value })}><option>Good</option><option>Fair</option><option>Poor</option></select></div>
            <div><label className="text-[11.5px] font-semibold text-slate-600">Status</label><select className="input mt-1" value={edit.status || ''} onChange={(e) => setEdit({ ...edit, status: e.target.value })}><option>Available</option><option>Assigned</option><option>In Use</option><option>Under Repair</option><option>Damaged</option></select></div>
          </div>
        )}
      </Modal>

      <Modal open={!!qr} onClose={() => setQr(null)} title="Asset Tag / QR" subtitle={qr?.code || ''}>
        {qr && (
          <div className="text-center">
            <div className="mx-auto w-[200px] h-[200px] checkerboard rounded-xl border-2 border-slate-900 grid place-items-center">
              <div className="w-[160px] h-[160px] bg-white rounded-md grid place-items-center">
                <div className="grid grid-cols-8 gap-0.5">
                  {Array.from({ length: 64 }).map((_, i) => <div key={i} className={`w-3 h-3 ${((i * 7 + qr.code.length + qr.name.length) % 3) === 0 ? 'bg-slate-900' : 'bg-white'}`} />)}
                </div>
              </div>
            </div>
            <div className="mt-3 font-mono font-bold text-[15px]">{qr.code}</div>
            <div className="text-[12.5px] text-slate-700">{qr.name}</div>
            <div className="text-[11px] text-slate-500 mt-1">Government ITI Raigarh · Asset Tag · FY 2025-26</div>
            <button onClick={() => window.print()} className="btn btn-primary mt-4 h-9">Print Tag</button>
          </div>
        )}
      </Modal>
    </Shell>
  );
}
