import { useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { fmtDate, fmtINR } from '../lib/format';
import { BarChart3, Download, FileText, Printer } from 'lucide-react';

const REPORTS = [
  { id: 'stock', name: 'Current Stock & Ledger' },
  { id: 'valuation', name: 'Stock Valuation' },
  { id: 'consumption', name: 'Department/Trade Consumption' },
  { id: 'issue', name: 'Material Issues' },
  { id: 'requisition', name: 'Requisitions & Approvals' },
  { id: 'procurement', name: 'Procurement/PO/GRN' },
  { id: 'vendor', name: 'Vendor Report' },
  { id: 'asset', name: 'Asset/Tools Register' },
  { id: 'low', name: 'Low / Out-of-Stock' },
  { id: 'audit', name: 'Audit Trail' },
];

export default function Reports() {
  const { items, matReqs, issues, assets, vendors, audit, departments, trades, procurement } = useData();
  const [type, setType] = useState('stock');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dept, setDept] = useState('');
  const [trade, setTrade] = useState('');

  const { title, rows } = useMemo(() => {
    if (type === 'stock') {
      return { title: 'Current Stock & Ledger', rows: items.map((it) => ({ code: it.code, name: it.name, opening: 0, receipts: it.stock?.receipts || 0, issues: it.stock?.issues || 0, returns: it.stock?.returns || 0, available: it.stock?.available || 0, rate: fmtINR(it.rate), value: fmtINR((it.stock?.available || 0) * it.rate) })) };
    }
    if (type === 'valuation') {
      const total = items.reduce((s, it) => s + (it.stock?.available || 0) * it.rate, 0);
      return { title: `Stock Valuation (Total: ${fmtINR(total)})`, rows: items.map((it) => ({ code: it.code, name: it.name, available: it.stock?.available || 0, rate: fmtINR(it.rate), value: fmtINR((it.stock?.available || 0) * it.rate) })) };
    }
    if (type === 'consumption') {
      const map: Record<string, number> = {};
      issues.forEach((iss) => {
        const req = matReqs.find((r) => r.id === iss.req_id);
        if (!req) return;
        if (dept && req.dept_id !== dept) return;
        if (trade && req.trade_id !== trade) return;
        const key = `${departments.find((d) => d.id === req.dept_id)?.name || '-'} / ${trades.find((t) => t.id === req.trade_id)?.name || '-'}`;
        iss.items?.forEach((it) => { map[key] = (map[key] || 0) + Number(it.issued_qty || 0); });
      });
      return { title: 'Department / Trade Consumption', rows: Object.entries(map).map(([k, v]) => ({ department_trade: k, quantity_issued: v })) };
    }
    if (type === 'issue') return { title: 'Material Issues', rows: issues.map((iss) => ({ no: iss.no, date: fmtDate(iss.date), req_no: iss.req_no, items: iss.items?.length || 0, by: iss.issued_by_name, status: iss.status })) };
    if (type === 'requisition') return { title: 'Requisitions', rows: matReqs.filter((r) => { if (dept && r.dept_id !== dept) return false; if (trade && r.trade_id !== trade) return false; if (from && new Date(r.date) < new Date(from)) return false; if (to && new Date(r.date) > new Date(to)) return false; return true; }).map((r) => ({ no: r.no, date: fmtDate(r.date), requester: r.requester_name, priority: r.priority, status: r.status })) };
    if (type === 'procurement') return { title: 'Procurement', rows: (procurement.purchase_orders as Array<{ no: string; pr_id: string; vendor_id: string; date: string; grand_total: number; status: string }>).map((p) => ({ po: p.no, vendor: vendors.find((v) => v.id === p.vendor_id)?.name || '-', date: fmtDate(p.date), total: fmtINR(p.grand_total), status: p.status })) };
    if (type === 'vendor') return { title: 'Vendor Report', rows: vendors.map((v) => ({ code: v.code, name: v.name, gst: v.gst, contact: v.contact, rating: v.rating })) };
    if (type === 'asset') return { title: 'Asset Register', rows: assets.map((a) => ({ code: a.code, name: a.name, cat: a.cat, serial: a.serial, cost: fmtINR(a.cost), status: a.status })) };
    if (type === 'low') return { title: 'Low/Out-of-Stock', rows: items.filter((it) => (it.stock?.available || 0) <= it.reorder).map((it) => ({ code: it.code, name: it.name, available: it.stock?.available || 0, reorder: it.reorder, min: it.min_qty })) };
    if (type === 'audit') return { title: 'Audit Trail', rows: audit.slice(0, 100).map((a) => ({ time: fmtDate(a.created_at), user: a.user_name, action: a.action, module: a.module, record: a.record_id })) };
    return { title: 'Report', rows: [] };
  }, [type, items, issues, matReqs, departments, trades, assets, vendors, procurement, audit, from, to, dept, trade]);

  const keys = rows[0] ? Object.keys(rows[0]) : [];

  const exportCSV = () => {
    const csv = [keys, ...rows.map((r) => keys.map((k) => r[k as keyof typeof r]))].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report-${type}.csv`; a.click();
  };

  return (
    <Shell title="Reports & Analytics" subtitle="Generate operational and compliance reports">
      <div className="grid lg:grid-cols-4 gap-3 mb-4">
        <div className="card p-3">
          <label className="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide">Report Type</label>
          <select className="input input-sm mt-1" value={type} onChange={(e) => setType(e.target.value)}>
            {REPORTS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="card p-3">
          <label className="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide">From</label>
          <input type="date" className="input input-sm mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
          <label className="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide mt-2 block">To</label>
          <input type="date" className="input input-sm mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="card p-3">
          <label className="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide">Department</label>
          <select className="input input-sm mt-1" value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <label className="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide mt-2 block">Trade</label>
          <select className="input input-sm mt-1" value={trade} onChange={(e) => setTrade(e.target.value)}><option value="">All</option>{trades.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </div>
        <div className="card p-3 flex flex-col gap-2">
          <button onClick={exportCSV} className="btn btn-primary h-9 text-[12.5px]"><Download size={14} />Export CSV</button>
          <button onClick={() => window.print()} className="btn btn-ghost h-9 text-[12.5px]"><Printer size={14} />Print / PDF</button>
          <button className="btn btn-ghost h-9 text-[12.5px]"><FileText size={14} />Save Template</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="font-bold text-[15px] flex items-center gap-2 text-slate-900"><BarChart3 size={14} className="text-blue-700" />{title}</div>
            <div className="text-[11.5px] text-slate-500">{rows.length} records · Filters: {from || '–'} to {to || '–'} · {dept ? departments.find((d) => d.id === dept)?.name : 'All departments'}</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>{keys.map((k) => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => <tr key={i}>{keys.map((k) => <td key={k}>{String((r as Record<string, unknown>)[k] ?? '-')}</td>)}</tr>)}
              {rows.length === 0 && <tr><td colSpan={keys.length || 1} className="text-center py-10 text-slate-400">No data for filter</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
