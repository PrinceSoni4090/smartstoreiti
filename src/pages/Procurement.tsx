import { useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { fmtDate, fmtINR, priorityBadge, statusBadge } from '../lib/format';
import { Plus, ShoppingCart, Truck, Package } from 'lucide-react';

type PR = { id: string; no: string; date: string; dept_id: string; trade_id: string; requester_name: string; items: unknown[]; total: number; priority: string; status: string; purpose: string };
type PO = { id: string; no: string; pr_id: string; vendor_id: string; date: string; items: { item_id: string; qty: number; rate: number; total: number }[]; sub_total: number; tax_total: number; grand_total: number; delivery_date: string; status: string };
type GRN = { id: string; no: string; po_id: string; vendor_id: string; invoice_no: string; date: string; items: { item_id: string; ordered: number; received: number; accepted: number; rejected: number; rate: number }[]; status: string };

export default function Procurement() {
  const { procurement, vendors, items, departments, refresh } = useData();
  const { staff } = useAuth();
  const [tab, setTab] = useState<'pr' | 'po' | 'grn'>('pr');
  const [grnFor, setGrnFor] = useState<PO | null>(null);
  const [grnForm, setGrnForm] = useState<{ invoice_no: string; items: { item_id: string; ordered: number; received: number; accepted: number; rejected: number; rate: number }[] }>({ invoice_no: '', items: [] });
  const [busy, setBusy] = useState(false);

  const openGRN = (po: PO) => {
    setGrnFor(po);
    setGrnForm({ invoice_no: '', items: po.items.map((it) => ({ item_id: it.item_id, ordered: it.qty, received: it.qty, accepted: it.qty, rejected: 0, rate: it.rate })) });
  };

  const submitGRN = async () => {
    if (!grnFor) return;
    setBusy(true);
    try {
      await fetch('/api/procurement?kind=grn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        kind: 'grn', po_id: grnFor.id, vendor_id: grnFor.vendor_id, invoice_no: grnForm.invoice_no,
        items: grnForm.items, user_id: staff?.id, user_name: staff?.name,
      }) });
      await refresh();
      setGrnFor(null);
    } catch { alert('GRN failed'); }
    setBusy(false);
  };

  return (
    <Shell title="Procurement Management" subtitle="Purchase Requisitions → Purchase Orders → Goods Receipt Notes (GRN)">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('pr')} className={`btn h-9 text-[12.5px] ${tab === 'pr' ? 'btn-primary' : 'btn-ghost'}`}><ShoppingCart size={14} />Purchase Requisitions ({(procurement.purchase_reqs as unknown[]).length})</button>
        <button onClick={() => setTab('po')} className={`btn h-9 text-[12.5px] ${tab === 'po' ? 'btn-primary' : 'btn-ghost'}`}><Truck size={14} />Purchase Orders ({(procurement.purchase_orders as unknown[]).length})</button>
        <button onClick={() => setTab('grn')} className={`btn h-9 text-[12.5px] ${tab === 'grn' ? 'btn-primary' : 'btn-ghost'}`}><Package size={14} />Goods Receipts ({(procurement.grns as unknown[]).length})</button>
      </div>

      {tab === 'pr' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>PR No</th><th>Date</th><th>Dept</th><th>Requester</th><th>Items</th><th className="text-right">Total</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {(procurement.purchase_reqs as PR[]).map((pr) => (
                <tr key={pr.id}>
                  <td className="font-mono font-bold">{pr.no}</td>
                  <td>{fmtDate(pr.date)}</td>
                  <td className="text-[12px]">{departments.find((d) => d.id === pr.dept_id)?.name || '-'}</td>
                  <td>{pr.requester_name}</td>
                  <td>{pr.items?.length || 0}</td>
                  <td className="text-right font-semibold">{fmtINR(pr.total)}</td>
                  <td><span className={priorityBadge(pr.priority)}>{pr.priority}</span></td>
                  <td><span className={statusBadge(pr.status)}>{pr.status}</span></td>
                </tr>
              ))}
              {(procurement.purchase_reqs as unknown[]).length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">No purchase requisitions</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'po' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>PO No</th><th>Vendor</th><th>Date</th><th>Delivery</th><th>Items</th><th className="text-right">Grand Total</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {(procurement.purchase_orders as PO[]).map((po) => (
                <tr key={po.id}>
                  <td className="font-mono font-bold">{po.no}</td>
                  <td>{vendors.find((v) => v.id === po.vendor_id)?.name || '-'}</td>
                  <td>{fmtDate(po.date)}</td>
                  <td>{fmtDate(po.delivery_date)}</td>
                  <td>{po.items?.length || 0}</td>
                  <td className="text-right font-semibold">{fmtINR(po.grand_total)}</td>
                  <td><span className={statusBadge(po.status)}>{po.status}</span></td>
                  <td>{po.status !== 'Completed' && <button onClick={() => openGRN(po)} className="btn btn-primary h-7 text-[11px]"><Package size={11} />Receive (GRN)</button>}</td>
                </tr>
              ))}
              {(procurement.purchase_orders as unknown[]).length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">No purchase orders</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'grn' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>GRN No</th><th>PO No</th><th>Vendor</th><th>Invoice</th><th>Date</th><th>Items</th><th className="text-right">Received / Accepted</th><th>Status</th></tr></thead>
            <tbody>
              {(procurement.grns as GRN[]).map((g) => {
                const po = (procurement.purchase_orders as PO[]).find((p) => p.id === g.po_id);
                const rec = g.items?.reduce((s, i) => s + Number(i.received || 0), 0) || 0;
                const acc = g.items?.reduce((s, i) => s + Number(i.accepted || 0), 0) || 0;
                return (
                  <tr key={g.id}>
                    <td className="font-mono font-bold">{g.no}</td>
                    <td className="font-mono text-[11.5px]">{po?.no || '-'}</td>
                    <td>{vendors.find((v) => v.id === g.vendor_id)?.name || '-'}</td>
                    <td>{g.invoice_no}</td>
                    <td>{fmtDate(g.date)}</td>
                    <td>{g.items?.length || 0}</td>
                    <td className="text-right font-mono text-[11.5px]">{rec} / {acc}</td>
                    <td><span className={statusBadge(g.status)}>{g.status}</span></td>
                  </tr>
                );
              })}
              {(procurement.grns as unknown[]).length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">No GRNs recorded</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!grnFor} onClose={() => setGrnFor(null)} title="Goods Receipt Note (GRN)" subtitle={grnFor ? `Against PO ${grnFor.no}` : ''} size="lg"
        footer={<><button onClick={() => setGrnFor(null)} className="btn btn-ghost h-9">Cancel</button><button onClick={submitGRN} disabled={busy} className="btn btn-primary h-9"><Plus size={14} />{busy ? 'Recording…' : 'Record GRN & Update Stock'}</button></>}>
        {grnFor && (
          <>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div><label className="text-[11.5px] font-semibold text-slate-600">Vendor</label><div className="input mt-1 flex items-center">{vendors.find((v) => v.id === grnFor.vendor_id)?.name}</div></div>
              <div><label className="text-[11.5px] font-semibold text-slate-600">Invoice No</label><input className="input mt-1" value={grnForm.invoice_no} onChange={(e) => setGrnForm({ ...grnForm, invoice_no: e.target.value })} placeholder="INV-XXXX" /></div>
              <div><label className="text-[11.5px] font-semibold text-slate-600">Received On</label><div className="input mt-1 flex items-center">{new Date().toLocaleDateString('en-IN')}</div></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item</th><th className="text-right">Ordered</th><th className="text-right">Received</th><th className="text-right">Accepted</th><th className="text-right">Rejected</th></tr></thead>
                <tbody>
                  {grnForm.items.map((it, i) => {
                    const item = items.find((x) => x.id === it.item_id);
                    return (
                      <tr key={i}>
                        <td><span className="font-mono text-[11px]">{item?.code}</span> — {item?.name}</td>
                        <td className="text-right">{it.ordered}</td>
                        <td className="text-right"><input type="number" className="input input-sm w-[80px] text-right" value={it.received} onChange={(e) => { const ni = [...grnForm.items]; ni[i] = { ...it, received: Number(e.target.value) }; setGrnForm({ ...grnForm, items: ni }); }} /></td>
                        <td className="text-right"><input type="number" className="input input-sm w-[80px] text-right" value={it.accepted} onChange={(e) => { const ni = [...grnForm.items]; ni[i] = { ...it, accepted: Number(e.target.value), rejected: Number(it.received) - Number(e.target.value) }; setGrnForm({ ...grnForm, items: ni }); }} /></td>
                        <td className="text-right">{it.rejected}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[11.5px] text-slate-500">✓ Accepted quantity will be added to stock and a Receipt transaction recorded.</div>
          </>
        )}
      </Modal>
    </Shell>
  );
}
