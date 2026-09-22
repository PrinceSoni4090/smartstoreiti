import { useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { fmtDate, fmtDateTime, priorityBadge, statusBadge } from '../lib/format';
import { Plus, Search, Trash2, CheckCircle2, XCircle, FileText, Eye, ArrowRight, Send, ShieldCheck } from 'lucide-react';
import { can } from '../lib/rbac';
import type { MatReq, ReqItem } from '../lib/types';

const emptyItem: ReqItem = { item_id: '', qty: 1, purpose: '' };

export default function Requisitions() {
  const { matReqs, items, departments, trades, refreshReqs, refreshItems, refreshIssues } = useData();
  const { staff, role } = useAuth();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewReq, setViewReq] = useState<MatReq | null>(null);
  const [busy, setBusy] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');

  const [form, setForm] = useState<{
    dept_id: string; trade_id: string; purpose: string; required_date: string; priority: string; remarks: string; items: ReqItem[];
  }>({
    dept_id: staff?.dept_id || '',
    trade_id: staff?.trade_id || '',
    purpose: '',
    required_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    priority: 'Medium',
    remarks: '',
    items: [{ ...emptyItem }],
  });

  const filtered = useMemo(() => {
    return matReqs.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!(r.no.toLowerCase().includes(s) || r.requester_name?.toLowerCase().includes(s) || r.purpose?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [matReqs, q, statusFilter, priorityFilter]);

  const submit = async () => {
    if (!form.dept_id || !form.trade_id || form.items.length === 0 || !form.items[0].item_id) { alert('Fill department, trade and at least one item'); return; }
    setBusy(true);
    try {
      await fetch('/api/requisitions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept_id: form.dept_id, trade_id: form.trade_id,
          requester_id: staff?.id, requester_name: staff?.name,
          items: form.items, purpose: form.purpose, required_date: new Date(form.required_date).toISOString(),
          priority: form.priority, remarks: form.remarks,
        }),
      });
      await refreshReqs();
      setShowForm(false);
      setForm({ ...form, purpose: '', remarks: '', items: [{ ...emptyItem }] });
    } catch { alert('Failed to create requisition'); }
    setBusy(false);
  };

  const doAction = async (id: string, action: string) => {
    if (!confirm(`Confirm ${action} on this requisition?`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/requisitions', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, user_id: staff?.id, user_name: staff?.name, user_role: role, note: decisionNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshReqs();
      setViewReq(null);
      setDecisionNote('');
    } catch (e) { alert((e as Error).message); }
    setBusy(false);
  };

  const issue = async (id: string) => {
    if (!confirm('Create issue slip? Stock will be deducted immediately.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ req_id: id, user_id: staff?.id, user_name: staff?.name, user_role: role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await Promise.all([refreshReqs(), refreshItems(), refreshIssues()]);
      alert('Issue slip created: ' + data.no);
      setViewReq(null);
    } catch (e) { alert((e as Error).message); }
    setBusy(false);
  };

  const canCreate = role && ['Instructor/Staff', 'Department/Trade Head', 'Store In-Charge', 'Super Admin'].includes(role);
  const canApprove = role === 'Principal' || role === 'Super Admin';
  const canVerify = role === 'Store In-Charge' || role === 'Super Admin';
  const canIssue = role === 'Store In-Charge' || role === 'Super Admin';

  return (
    <Shell title="Material Requisitions" subtitle="4-step workflow: Instructor → Store verify → Principal approve → Issue"
      actions={canCreate ? <button onClick={() => setShowForm(true)} className="btn btn-primary h-9 text-[12.5px]"><Plus size={14} />New Requisition</button> : null}
    >
      <div className="card p-3 flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <input className="input input-sm pl-9" placeholder="Search requisition, requester, purpose…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <select className="input input-sm w-[200px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option>Pending Verification</option>
          <option>Pending Principal Approval</option>
          <option>Approved</option>
          <option>Issued</option>
          <option>Rejected</option>
          <option>Returned for Correction</option>
        </select>
        <select className="input input-sm w-[130px]" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Urgent</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.map((r) => (
          <div key={r.id} className="card p-4 hover:shadow-md transition">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[13px]">{r.no}</span>
                  <span className={statusBadge(r.status)}>{r.status}</span>
                  <span className={priorityBadge(r.priority)}>{r.priority}</span>
                </div>
                <div className="mt-1 text-[12px] text-slate-600">
                  {departments.find((d) => d.id === r.dept_id)?.name} • {trades.find((t) => t.id === r.trade_id)?.name} • {r.requester_name} • {fmtDate(r.date)}
                </div>
                <div className="mt-1 text-[11.5px] text-slate-500">Purpose: {r.purpose} • Required: {fmtDate(r.required_date)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setViewReq(r)} className="btn btn-ghost h-8 text-[11.5px]"><Eye size={12} />View</button>
                {r.status === 'Pending Verification' && canVerify && (
                  <button onClick={() => doAction(r.id, 'verify')} className="btn btn-primary h-8 text-[11.5px]"><ShieldCheck size={12} />Verify & Forward</button>
                )}
                {r.status === 'Pending Principal Approval' && canApprove && (
                  <>
                    <button onClick={() => doAction(r.id, 'approve')} className="btn btn-success h-8 text-[11.5px]"><CheckCircle2 size={12} />Approve</button>
                    <button onClick={() => doAction(r.id, 'reject')} className="btn btn-danger h-8 text-[11.5px]"><XCircle size={12} />Reject</button>
                  </>
                )}
                {r.status === 'Pending Principal Approval' && !canApprove && role === 'Store In-Charge' && (
                  <span className="text-[11px] px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700">Awaiting Principal – Store cannot approve final</span>
                )}
                {r.status === 'Approved' && canIssue && (
                  <button onClick={() => issue(r.id)} className="btn btn-primary h-8 text-[11.5px]"><Send size={12} />Create Issue Slip</button>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-xl border bg-slate-50 p-2">
              <table className="w-full text-[11.5px]">
                <thead className="text-slate-500">
                  <tr>
                    <th className="text-left font-semibold px-2 py-1">Item</th>
                    <th className="text-right font-semibold px-2 py-1">Qty</th>
                    <th className="text-right font-semibold px-2 py-1">Available</th>
                    <th className="text-left font-semibold px-2 py-1">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items?.map((it, i) => {
                    const item = items.find((x) => x.id === it.item_id);
                    return (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="px-2 py-1"><span className="font-mono text-[10.5px]">{item?.code}</span> — {item?.name}</td>
                        <td className="px-2 py-1 text-right font-bold">{it.qty}</td>
                        <td className="px-2 py-1 text-right text-slate-500">{item?.stock?.available || 0}</td>
                        <td className="px-2 py-1 text-slate-500">{it.purpose || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {r.history && r.history.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.history.map((h, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200">
                    <ArrowRight size={9} className="inline mr-0.5" />{fmtDateTime(h.at)} · {h.action} by {h.by_name}
                    {h.note ? ` (${h.note})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="card p-10 text-center text-slate-400">No requisitions found</div>}
      </div>

      {/* View Modal */}
      <Modal open={!!viewReq} onClose={() => setViewReq(null)} title={viewReq ? `Requisition ${viewReq.no}` : ''} subtitle={viewReq?.status} size="lg">
        {viewReq && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
              <div><div className="text-slate-500 text-[10.5px] font-semibold uppercase">Department</div><div>{departments.find((d) => d.id === viewReq.dept_id)?.name}</div></div>
              <div><div className="text-slate-500 text-[10.5px] font-semibold uppercase">Trade</div><div>{trades.find((t) => t.id === viewReq.trade_id)?.name}</div></div>
              <div><div className="text-slate-500 text-[10.5px] font-semibold uppercase">Requester</div><div>{viewReq.requester_name}</div></div>
              <div><div className="text-slate-500 text-[10.5px] font-semibold uppercase">Required</div><div>{fmtDate(viewReq.required_date)}</div></div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[12.5px]">
              <div className="font-semibold text-blue-900">Purpose</div>
              <div className="mt-0.5 text-slate-700">{viewReq.purpose}</div>
              {viewReq.remarks && <div className="mt-2 text-[11.5px] text-slate-500">Remarks: {viewReq.remarks}</div>}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item</th><th className="text-right">Req Qty</th><th className="text-right">Available</th><th>Purpose</th></tr></thead>
                <tbody>
                  {viewReq.items.map((it, i) => {
                    const item = items.find((x) => x.id === it.item_id);
                    return (
                      <tr key={i}>
                        <td><span className="font-mono text-[11px]">{item?.code}</span> — {item?.name}</td>
                        <td className="text-right font-bold">{it.qty}</td>
                        <td className="text-right">{item?.stock?.available || 0}</td>
                        <td>{it.purpose || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Approval Timeline</div>
              <div className="space-y-2">
                {viewReq.history?.map((h, i) => (
                  <div key={i} className="flex gap-3 text-[12px]">
                    <div className="w-1.5 rounded bg-blue-500" />
                    <div>
                      <div className="font-semibold">{h.action} <span className="text-slate-500 font-normal">by {h.by_name}</span></div>
                      <div className="text-[11px] text-slate-500">{fmtDateTime(h.at)} {h.note && ` • ${h.note}`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(viewReq.status === 'Pending Verification' && canVerify) || (viewReq.status === 'Pending Principal Approval' && canApprove) ? (
              <div>
                <label className="text-[11.5px] font-semibold text-slate-600">Decision Note (optional)</label>
                <textarea className="input mt-1" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Optional remarks…" />
                <div className="mt-2 flex gap-2 justify-end">
                  {viewReq.status === 'Pending Verification' && canVerify && (
                    <button disabled={busy} onClick={() => doAction(viewReq.id, 'verify')} className="btn btn-primary h-9"><ShieldCheck size={14} />Verify & Forward</button>
                  )}
                  {viewReq.status === 'Pending Principal Approval' && canApprove && (
                    <>
                      <button disabled={busy} onClick={() => doAction(viewReq.id, 'reject')} className="btn btn-danger h-9"><XCircle size={14} />Reject</button>
                      <button disabled={busy} onClick={() => doAction(viewReq.id, 'approve')} className="btn btn-success h-9"><CheckCircle2 size={14} />Approve</button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Material Requisition" subtitle="Requisition will follow: Store Verify → Principal Approval → Issue" size="lg"
        footer={<>
          <button onClick={() => setShowForm(false)} className="btn btn-ghost h-9">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn btn-primary h-9"><FileText size={14} />{busy ? 'Submitting…' : 'Submit Requisition'}</button>
        </>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11.5px] font-semibold text-slate-600">Department *</label>
            <select className="input mt-1" value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}>
              <option value="">Select…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11.5px] font-semibold text-slate-600">Trade *</label>
            <select className="input mt-1" value={form.trade_id} onChange={(e) => setForm({ ...form, trade_id: e.target.value })}>
              <option value="">Select…</option>
              {trades.filter((t) => !form.dept_id || t.dept_id === form.dept_id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11.5px] font-semibold text-slate-600">Required By *</label>
            <input type="date" className="input mt-1" value={form.required_date} onChange={(e) => setForm({ ...form, required_date: e.target.value })} />
          </div>
          <div>
            <label className="text-[11.5px] font-semibold text-slate-600">Priority</label>
            <select className="input mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11.5px] font-semibold text-slate-600">Purpose *</label>
            <input className="input mt-1" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Fitter practical batch 2025" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[12.5px] font-bold text-slate-700">Items Requested</div>
            <button onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })} className="btn btn-ghost h-8 text-[11.5px]"><Plus size={12} />Add Item</button>
          </div>
          <div className="space-y-2">
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end p-2 rounded-xl border border-slate-200">
                <div className="col-span-12 sm:col-span-6">
                  <label className="text-[10.5px] font-semibold text-slate-500">Item</label>
                  <select className="input input-sm mt-1" value={it.item_id} onChange={(e) => {
                    const ni = [...form.items]; ni[i] = { ...it, item_id: e.target.value }; setForm({ ...form, items: ni });
                  }}>
                    <option value="">Select item…</option>
                    {items.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.name} (Avail: {x.stock?.available || 0})</option>)}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10.5px] font-semibold text-slate-500">Qty</label>
                  <input type="number" className="input input-sm mt-1" value={it.qty} onChange={(e) => {
                    const ni = [...form.items]; ni[i] = { ...it, qty: Number(e.target.value) }; setForm({ ...form, items: ni });
                  }} />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="text-[10.5px] font-semibold text-slate-500">Purpose</label>
                  <input className="input input-sm mt-1" value={it.purpose || ''} onChange={(e) => {
                    const ni = [...form.items]; ni[i] = { ...it, purpose: e.target.value }; setForm({ ...form, items: ni });
                  }} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <button onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })} className="btn btn-danger h-9 w-full justify-center px-0"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <label className="text-[11.5px] font-semibold text-slate-600">Remarks</label>
          <textarea className="input mt-1" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Additional notes for approver…" />
        </div>
      </Modal>
    </Shell>
  );
}
