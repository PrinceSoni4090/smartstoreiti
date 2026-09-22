import { useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { fmtDate, statusBadge } from '../lib/format';
import { Plus, ClipboardCheck, CheckCircle2 } from 'lucide-react';

type VerItem = { item_id: string; system_qty: number; physical_qty: number; diff: number; type: string; reason: string };
type Verification = { id: string; no: string; date: string; officer_id: string; officer_name: string; items: VerItem[]; status: string; discrepancy: number; remarks: string };

export default function VerificationPage() {
  const { verifications, items, refresh } = useData();
  const { staff } = useAuth();
  const [show, setShow] = useState(false);
  const [rows, setRows] = useState<VerItem[]>([]);
  const [busy, setBusy] = useState(false);

  const start = () => {
    setRows(items.slice(0, 8).map((it) => ({
      item_id: it.id, system_qty: it.stock?.available || 0,
      physical_qty: it.stock?.available || 0, diff: 0, type: 'OK', reason: '',
    })));
    setShow(true);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await fetch('/api/verifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officer_id: staff?.id, officer_name: staff?.name, items: rows }) });
      await refresh();
      setShow(false);
    } catch { alert('Failed'); }
    setBusy(false);
  };

  const approve = async (id: string) => {
    await fetch('/api/verifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) });
    await refresh();
  };

  return (
    <Shell title="Physical Stock Verification" subtitle="Periodic verification of physical stock vs system records"
      actions={<button onClick={start} className="btn btn-primary h-9 text-[12.5px]"><Plus size={14} />New Verification</button>}
    >
      <div className="grid gap-3">
        {(verifications as Verification[]).map((v) => (
          <div key={v.id} className="card p-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2"><span className="font-mono font-bold text-[13px]">{v.no}</span><span className={statusBadge(v.status)}>{v.status}</span></div>
                <div className="mt-1 text-[12px] text-slate-600"><ClipboardCheck size={12} className="inline" /> Officer: {v.officer_name} · {fmtDate(v.date)} · Discrepancy count: {v.discrepancy}</div>
              </div>
              <div className="flex gap-2">
                {v.status === 'Pending Approval' && <button onClick={() => approve(v.id)} className="btn btn-primary h-8 text-[11.5px]"><CheckCircle2 size={12} />Approve</button>}
              </div>
            </div>
            <div className="mt-3 table-wrap">
              <table>
                <thead><tr><th>Item</th><th className="text-right">System</th><th className="text-right">Physical</th><th className="text-right">Diff</th><th>Type</th><th>Reason</th></tr></thead>
                <tbody>
                  {v.items?.map((it, i) => {
                    const item = items.find((x) => x.id === it.item_id);
                    return (
                      <tr key={i}>
                        <td className="font-mono text-[11px]">{item?.code} — <span className="font-sans">{item?.name}</span></td>
                        <td className="text-right">{it.system_qty}</td>
                        <td className="text-right">{it.physical_qty}</td>
                        <td className={`text-right font-bold ${it.diff < 0 ? 'text-red-600' : it.diff > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{it.diff}</td>
                        <td>{it.type}</td>
                        <td className="text-[11.5px] text-slate-500">{it.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {(verifications as Verification[]).length === 0 && <div className="card p-10 text-center text-slate-400">No verifications recorded</div>}
      </div>

      <Modal open={show} onClose={() => setShow(false)} title="New Stock Verification" subtitle="Record physical vs system count discrepancies" size="xl"
        footer={<><button onClick={() => setShow(false)} className="btn btn-ghost h-9">Cancel</button><button onClick={submit} disabled={busy} className="btn btn-primary h-9">{busy ? 'Saving…' : 'Record Verification'}</button></>}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th className="text-right">System</th><th className="text-right">Physical</th><th className="text-right">Diff</th><th>Reason</th></tr></thead>
            <tbody>
              {rows.map((it, i) => {
                const item = items.find((x) => x.id === it.item_id);
                return (
                  <tr key={i}>
                    <td><span className="font-mono text-[11px]">{item?.code}</span> {item?.name}</td>
                    <td className="text-right font-mono">{it.system_qty}</td>
                    <td className="text-right"><input type="number" className="input input-sm w-[90px] text-right" value={it.physical_qty} onChange={(e) => {
                      const nr = [...rows]; const p = Number(e.target.value); const d = p - it.system_qty;
                      nr[i] = { ...it, physical_qty: p, diff: d, type: d < 0 ? 'Shortage' : d > 0 ? 'Excess' : 'OK' }; setRows(nr);
                    }} /></td>
                    <td className={`text-right font-bold ${it.diff < 0 ? 'text-red-600' : it.diff > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{it.diff}</td>
                    <td><input className="input input-sm" value={it.reason} onChange={(e) => { const nr = [...rows]; nr[i] = { ...it, reason: e.target.value }; setRows(nr); }} placeholder="If any discrepancy…" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </Shell>
  );
}
