import { useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { fmtDate, statusBadge } from '../lib/format';
import { Plus, Undo2 } from 'lucide-react';

type ReturnLine = { item_id: string; issued_qty: number; returned_qty: number; usable: number; damaged: number };

export default function Returns() {
  const { returns, issues, items, refresh } = useData();
  const { staff } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ issue_id: string; reason: string; remarks: string; items: ReturnLine[] }>({ issue_id: '', reason: '', remarks: '', items: [] });

  const onSelectIssue = (id: string) => {
    const iss = issues.find((i) => i.id === id);
    if (!iss) return;
    setForm({ issue_id: id, reason: '', remarks: '', items: iss.items.map((it) => ({ item_id: it.item_id, issued_qty: it.issued_qty, returned_qty: it.issued_qty, usable: it.issued_qty, damaged: 0 })) });
  };

  const submit = async () => {
    if (!form.issue_id) { alert('Select an issue slip'); return; }
    setBusy(true);
    try {
      await fetch('/api/returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        issue_id: form.issue_id,
        requester_id: staff?.id, requester_name: staff?.name,
        dept_id: staff?.dept_id, trade_id: staff?.trade_id,
        items: form.items, reason: form.reason, remarks: form.remarks,
      }) });
      await refresh();
      setShow(false);
    } catch { alert('Return failed'); }
    setBusy(false);
  };

  return (
    <Shell title="Material Returns" subtitle="Usable qty is restocked; damaged qty is booked to dead stock"
      actions={<button onClick={() => setShow(true)} className="btn btn-primary h-9 text-[12.5px]"><Plus size={14} />New Return</button>}
    >
      <div className="table-wrap">
        <table>
          <thead><tr><th>Return No</th><th>Issue No</th><th>Date</th><th>Requester</th><th>Items</th><th>Usable / Damaged</th><th>Status</th></tr></thead>
          <tbody>
            {(returns as Array<{ id: string; no: string; issue_no: string; date: string; requester_name: string; items: ReturnLine[]; status: string }>).map((ret) => (
              <tr key={ret.id}>
                <td className="font-mono font-bold">{ret.no}</td>
                <td className="font-mono text-[11.5px]">{ret.issue_no}</td>
                <td>{fmtDate(ret.date)}</td>
                <td>{ret.requester_name}</td>
                <td className="text-[11.5px]">{ret.items?.map((it, i) => {
                  const item = items.find((x) => x.id === it.item_id);
                  return <span key={i} className="inline-block mr-2"><span className="font-mono">{item?.code}</span> ret <b>{it.returned_qty}</b></span>;
                })}</td>
                <td className="font-mono text-[11.5px]">{ret.items?.reduce((s, i) => s + Number(i.usable || 0), 0)} / {ret.items?.reduce((s, i) => s + Number(i.damaged || 0), 0)}</td>
                <td><span className={statusBadge(ret.status)}>{ret.status}</span></td>
              </tr>
            ))}
            {(returns as unknown[]).length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No returns recorded</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={show} onClose={() => setShow(false)} title="Record Material Return" subtitle="Return items against a prior issue slip" size="lg"
        footer={<><button onClick={() => setShow(false)} className="btn btn-ghost h-9">Cancel</button><button onClick={submit} disabled={busy} className="btn btn-primary h-9"><Undo2 size={14} />{busy ? 'Saving…' : 'Record Return'}</button></>}
      >
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="text-[11.5px] font-semibold text-slate-600">Issue Slip *</label>
            <select className="input mt-1" value={form.issue_id} onChange={(e) => onSelectIssue(e.target.value)}>
              <option value="">Select issue slip…</option>
              {issues.map((i) => <option key={i.id} value={i.id}>{i.no} — {fmtDate(i.date)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11.5px] font-semibold text-slate-600">Reason</label>
            <input className="input mt-1" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Practical completed / balance return" />
          </div>
        </div>

        {form.items.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th className="text-right">Issued</th><th className="text-right">Returned</th><th className="text-right">Usable</th><th className="text-right">Damaged</th></tr></thead>
              <tbody>
                {form.items.map((it, i) => {
                  const item = items.find((x) => x.id === it.item_id);
                  return (
                    <tr key={i}>
                      <td><span className="font-mono text-[11px]">{item?.code}</span> — {item?.name}</td>
                      <td className="text-right">{it.issued_qty}</td>
                      <td className="text-right"><input type="number" className="input input-sm w-[80px] text-right" value={it.returned_qty} onChange={(e) => { const ni = [...form.items]; ni[i] = { ...it, returned_qty: Number(e.target.value) }; setForm({ ...form, items: ni }); }} /></td>
                      <td className="text-right"><input type="number" className="input input-sm w-[80px] text-right" value={it.usable} onChange={(e) => { const ni = [...form.items]; ni[i] = { ...it, usable: Number(e.target.value) }; setForm({ ...form, items: ni }); }} /></td>
                      <td className="text-right"><input type="number" className="input input-sm w-[80px] text-right" value={it.damaged} onChange={(e) => { const ni = [...form.items]; ni[i] = { ...it, damaged: Number(e.target.value) }; setForm({ ...form, items: ni }); }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3">
          <label className="text-[11.5px] font-semibold text-slate-600">Remarks</label>
          <textarea className="input mt-1" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
        </div>
      </Modal>
    </Shell>
  );
}
