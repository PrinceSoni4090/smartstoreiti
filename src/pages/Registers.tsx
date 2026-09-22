import { useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { fmtDate, fmtINR, statusBadge } from '../lib/format';
import { BookOpen, Download, Printer } from 'lucide-react';

const REGISTERS = [
  { id: 'stock', name: 'Store Stock Register', desc: 'Current stock with valuation' },
  { id: 'sanction', name: 'Store Sanction Register', desc: 'Approved requisitions & sanctions' },
  { id: 'issue', name: 'Material Issue Register', desc: 'All material issues with recipient' },
  { id: 'receipt', name: 'Material Receipt Register', desc: 'GRN & receipts' },
  { id: 'tools', name: 'Tools & Equipment Register', desc: 'Tools inventory' },
  { id: 'asset', name: 'Asset Register', desc: 'Fixed assets list' },
  { id: 'consumable', name: 'Consumable Register', desc: 'Consumable items consumption' },
  { id: 'noncons', name: 'Non-Consumable Register', desc: 'Non-consumable items' },
  { id: 'dead', name: 'Dead Stock Register', desc: 'Condemned / dead stock' },
  { id: 'repair', name: 'Repair Register', desc: 'Assets under repair' },
  { id: 'scrap', name: 'Scrap/Condemnation Register', desc: 'Scrap & disposal' },
  { id: 'verification', name: 'Stock Verification Register', desc: 'Verification records' },
  { id: 'loss', name: 'Loss/Shortage Register', desc: 'Shortage / excess' },
  { id: 'warranty', name: 'Warranty Register', desc: 'Warranty tracking' },
  { id: 'purchase', name: 'Purchase Register', desc: 'PO & procurement' },
  { id: 'vendor', name: 'Vendor Register', desc: 'Vendor list & rating' },
];

export default function Registers() {
  const { items, matReqs, issues, assets, vendors, categories, locations, procurement, verifications } = useData();
  const [active, setActive] = useState('stock');

  let rows: Record<string, unknown>[] = [];
  const reg = REGISTERS.find((r) => r.id === active)!;
  if (active === 'stock') rows = items.map((it) => ({ code: it.code, name: it.name, category: categories.find((c) => c.id === it.cat_id)?.name || '-', location: locations.find((l) => l.id === it.loc_id)?.name || '-', available: it.stock?.available || 0, rate: fmtINR(it.rate), value: fmtINR((it.stock?.available || 0) * it.rate) }));
  else if (active === 'sanction') rows = matReqs.filter((r) => ['Approved', 'Issued'].includes(r.status)).map((r) => ({ no: r.no, date: fmtDate(r.date), requester: r.requester_name, purpose: r.purpose, priority: r.priority, status: r.status }));
  else if (active === 'issue') rows = issues.map((iss) => ({ no: iss.no, date: fmtDate(iss.date), req_no: iss.req_no, items: iss.items?.length || 0, issued_by: iss.issued_by_name, status: iss.status }));
  else if (active === 'receipt') rows = (procurement.grns as Array<{ no: string; po_id: string; vendor_id: string; invoice_no: string; date: string; status: string }>).map((g) => ({ no: g.no, invoice: g.invoice_no, vendor: vendors.find((v) => v.id === g.vendor_id)?.name || '-', date: fmtDate(g.date), status: g.status }));
  else if (active === 'tools') rows = items.filter((it) => (categories.find((c) => c.id === it.cat_id)?.name || '').includes('Tools')).map((it) => ({ code: it.code, name: it.name, brand: it.brand, available: it.stock?.available || 0, location: locations.find((l) => l.id === it.loc_id)?.name || '-' }));
  else if (active === 'asset') rows = assets.map((a) => ({ code: a.code, name: a.name, make: a.make, serial: a.serial, location: locations.find((l) => l.id === a.loc_id)?.name || '-', cost: fmtINR(a.cost), status: a.status }));
  else if (active === 'consumable') rows = items.filter((it) => (categories.find((c) => c.id === it.cat_id)?.name || '') === 'Consumable').map((it) => ({ code: it.code, name: it.name, available: it.stock?.available || 0, issued: it.stock?.issues || 0, rate: fmtINR(it.rate) }));
  else if (active === 'noncons') rows = items.filter((it) => (categories.find((c) => c.id === it.cat_id)?.name || '') === 'Non-Consumable').map((it) => ({ code: it.code, name: it.name, available: it.stock?.available || 0, rate: fmtINR(it.rate) }));
  else if (active === 'dead') rows = assets.filter((a) => a.status === 'Damaged').map((a) => ({ code: a.code, name: a.name, condition: a.condition, cost: fmtINR(a.cost) }));
  else if (active === 'repair') rows = assets.filter((a) => a.status === 'Under Repair').map((a) => ({ code: a.code, name: a.name, assigned: a.assigned_to || '-', cost: fmtINR(a.cost) }));
  else if (active === 'scrap') rows = assets.filter((a) => a.status === 'Damaged').map((a) => ({ code: a.code, name: a.name, cost: fmtINR(a.cost), reason: 'Beyond economic repair' }));
  else if (active === 'verification') rows = (verifications as Array<{ no: string; date: string; officer_name: string; discrepancy: number; status: string }>).map((v) => ({ no: v.no, date: fmtDate(v.date), officer: v.officer_name, discrepancy: v.discrepancy, status: v.status }));
  else if (active === 'loss') rows = (verifications as Array<{ no: string; items: { item_id: string; diff: number; reason: string; type: string }[] }>).flatMap((v) => v.items?.filter((i) => i.diff < 0).map((i) => ({ verification: v.no, item: items.find((x) => x.id === i.item_id)?.code || i.item_id, shortage: Math.abs(i.diff), reason: i.reason, type: i.type })) || []);
  else if (active === 'warranty') rows = assets.filter((a) => a.warranty_till).map((a) => ({ code: a.code, name: a.name, warranty_till: fmtDate(a.warranty_till), status: new Date(a.warranty_till) < new Date() ? 'Expired' : 'Active' }));
  else if (active === 'purchase') rows = (procurement.purchase_orders as Array<{ no: string; vendor_id: string; date: string; grand_total: number; status: string }>).map((p) => ({ no: p.no, vendor: vendors.find((v) => v.id === p.vendor_id)?.name || '-', date: fmtDate(p.date), total: fmtINR(p.grand_total), status: p.status }));
  else if (active === 'vendor') rows = vendors.map((v) => ({ code: v.code, name: v.name, gst: v.gst, contact: v.contact, phone: v.phone, rating: v.rating }));

  const keys = rows[0] ? Object.keys(rows[0]) : [];

  const exportCSV = () => {
    const csvRows = [keys, ...rows.map((r) => keys.map((k) => r[k]))];
    const csv = csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${active}-register.csv`; a.click();
  };

  return (
    <Shell title="Government Registers" subtitle="16 statutory registers as required by DGET / Skill Development guidelines">
      <div className="card p-3 flex flex-wrap gap-2 mb-4">
        {REGISTERS.map((r) => (
          <button key={r.id} onClick={() => setActive(r.id)} className={`btn h-9 text-[11.5px] ${active === r.id ? 'btn-primary' : 'btn-ghost'}`}>
            <BookOpen size={12} />{r.name}
          </button>
        ))}
      </div>
      <div className="card p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <div>
            <div className="font-bold text-[15px] text-slate-900">{reg.name}</div>
            <div className="text-[11.5px] text-slate-500">{reg.desc} · {rows.length} records</div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn btn-ghost h-8 text-[11.5px]"><Download size={12} />CSV</button>
            <button onClick={() => window.print()} className="btn btn-ghost h-8 text-[11.5px]"><Printer size={12} />Print</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>{keys.map((k) => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{keys.map((k) => {
                  const v = r[k];
                  const isStatus = ['status'].includes(k);
                  return <td key={k}>{isStatus && typeof v === 'string' ? <span className={statusBadge(v)}>{v}</span> : String(v ?? '-')}</td>;
                })}</tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={keys.length || 1} className="text-center py-10 text-slate-400">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
