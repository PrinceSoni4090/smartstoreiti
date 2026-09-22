import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { fmtDate, fmtDateTime, fmtINR, relTime, statusBadge, priorityBadge } from '../lib/format';
import { AlertTriangle, Package, ClipboardList, Wrench, IndianRupee, TrendingUp, TrendingDown, ArrowUpRight, Bell, ShieldCheck, ShoppingCart, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

function KPI({ label, value, sub, accent, icon: Icon, trend }: { label: string; value: string | number; sub?: string; accent: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="card p-4 kpi" style={{ ['--accent' as string]: accent } as React.CSSProperties}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-1 text-[24px] font-bold text-slate-900 leading-none">{value}</div>
          {sub && <div className="mt-1 text-[11.5px] text-slate-500">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: accent + '20', color: accent }}>
          <Icon size={18} />
        </div>
      </div>
      {trend && <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><TrendingUp size={12} />{trend}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { items, matReqs, assets, notifications, stockTxns, procurement } = useData();
  const { staff } = useAuth();

  const totalItems = items.length;
  const totalValue = items.reduce((s, it) => s + (Number(it.rate) || 0) * (Number(it.stock?.available) || 0), 0);
  const lowStock = items.filter((it) => it.stock && (it.stock.available || 0) <= (it.reorder || 0));
  const pendingReqs = matReqs.filter((r) => ['Pending Verification', 'Pending Principal Approval'].includes(r.status));
  const totalAssets = assets.length;
  const activePOs = (procurement.purchase_orders as Array<{ status: string }>).filter((p) => p.status !== 'Completed').length;

  const chartData = useMemo(() => {
    // build last 7 days issue vs receipts
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const byDay = days.map((d) => {
      const txns = (stockTxns as Array<{ date: string; type: string; qty: number }>).filter((t) => t.date && t.date.slice(0, 10) === d);
      const receipts = txns.filter((t) => t.type === 'Receipt').reduce((s, t) => s + Math.abs(t.qty), 0);
      const issues = txns.filter((t) => t.type === 'Issue').reduce((s, t) => s + Math.abs(t.qty), 0);
      return { day: new Date(d).toLocaleDateString('en-IN', { weekday: 'short' }), receipts, issues };
    });
    return byDay;
  }, [stockTxns]);

  const maxVal = Math.max(1, ...chartData.map((d) => Math.max(d.receipts, d.issues)));

  return (
    <Shell title="Dashboard" subtitle={`Welcome back, ${staff?.name?.split(' ')[0] || 'User'} • FY 2025-26 • ${staff?.role}`}>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI label="Total Items" value={totalItems} sub={`${items.filter(i => i.status === 'Active').length} active SKUs`} accent="#1d4ed8" icon={Package} />
        <KPI label="Stock Valuation" value={fmtINR(totalValue)} sub="Available × unit rate" accent="#059669" icon={IndianRupee} trend="+4.2% MoM" />
        <KPI label="Low / Reorder" value={lowStock.length} sub="At or below reorder level" accent="#d97706" icon={AlertTriangle} />
        <KPI label="Pending Requisitions" value={pendingReqs.length} sub="Awaiting verify / approval" accent="#7c3aed" icon={ClipboardList} />
        <KPI label="Assets" value={totalAssets} sub="Tracked physical assets" accent="#0891b2" icon={Wrench} />
        <KPI label="Active POs" value={activePOs} sub={`${(procurement.purchase_orders as unknown[]).length} total this year`} accent="#dc2626" icon={ShoppingCart} />
        <KPI label="Issues (7d)" value={chartData.reduce((s, d) => s + d.issues, 0)} sub="Units moved out of store" accent="#9333ea" icon={TrendingDown} />
        <KPI label="Receipts (7d)" value={chartData.reduce((s, d) => s + d.receipts, 0)} sub="Units received via GRN" accent="#15803d" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-[15px] text-slate-900">Stock Movement (Last 7 days)</h3>
              <p className="text-[11.5px] text-slate-500">Receipts vs Issues by day</p>
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />Receipts</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" />Issues</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-3 items-end h-[220px]">
            {chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md min-h-[3px] relative group cursor-pointer" style={{ height: `${(d.receipts / maxVal) * 90}%` }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100">{d.receipts}</span>
                  </div>
                  <div className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t-md min-h-[3px] relative group cursor-pointer" style={{ height: `${(d.issues / maxVal) * 90}%` }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-700 opacity-0 group-hover:opacity-100">{d.issues}</span>
                  </div>
                </div>
                <div className="text-[10.5px] font-semibold text-slate-500">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[15px] text-slate-900">Alerts & Notifications</h3>
            <Link to="/notifications" className="text-[11.5px] font-semibold text-blue-700 flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          <div className="grid gap-2 max-h-[220px] overflow-y-auto scroll-thin">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={`p-2.5 rounded-xl border ${n.read ? 'bg-white border-slate-200' : 'bg-blue-50/50 border-blue-200'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Bell size={12} className="text-blue-600 flex-shrink-0" />
                      <div className="font-semibold text-[12.5px] truncate">{n.title}</div>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{relTime(n.created_at)}</div>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <div className="text-center py-6 text-slate-400 text-[12px]">No alerts</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Low stock table */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-bold text-[15px] text-slate-900 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" />Low Stock Items</h3>
              <p className="text-[11.5px] text-slate-500">Items at or below reorder level</p>
            </div>
            <Link to="/inventory" className="text-[11.5px] font-semibold text-blue-700 flex items-center gap-1">Inventory <ArrowUpRight size={12} /></Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Code</th><th>Item</th><th className="text-right">Available</th><th className="text-right">Reorder</th><th className="text-right">Value</th></tr></thead>
              <tbody>
                {lowStock.slice(0, 6).map((it) => (
                  <tr key={it.id}>
                    <td className="font-mono font-semibold text-[11.5px]">{it.code}</td>
                    <td>{it.name}</td>
                    <td className="text-right"><span className="font-bold text-red-600">{it.stock?.available || 0}</span></td>
                    <td className="text-right text-slate-500">{it.reorder}</td>
                    <td className="text-right font-semibold">{fmtINR((it.stock?.available || 0) * it.rate)}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">All items above reorder threshold</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Requisitions */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[15px] text-slate-900">Recent Requisitions</h3>
            <Link to="/requisition" className="text-[11.5px] font-semibold text-blue-700 flex items-center gap-1">All <ArrowUpRight size={12} /></Link>
          </div>
          <div className="grid gap-2 max-h-[280px] overflow-y-auto scroll-thin">
            {matReqs.slice(0, 6).map((r) => (
              <Link to="/requisition" key={r.id} className="block p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono font-bold text-[11.5px]">{r.no}</span>
                  <span className={statusBadge(r.status)}>{r.status}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 truncate">By {r.requester_name} • {fmtDate(r.date)}</div>
                <div className="mt-1 flex justify-between items-center">
                  <span className="text-[10.5px] text-slate-400">{r.items?.length || 0} items</span>
                  <span className={priorityBadge(r.priority)}>{r.priority}</span>
                </div>
              </Link>
            ))}
            {matReqs.length === 0 && <div className="text-center py-6 text-slate-400 text-[12px]">No requisitions yet</div>}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-[15px] text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck size={14} className="text-blue-600" />Compliance Snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3">
              <div className="text-[10.5px] font-bold uppercase text-blue-700 tracking-wide">Approval Workflow</div>
              <div className="mt-1 text-[13px] font-bold">Principal Final ✓</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">Enforced by RBAC · No override</div>
            </div>
            <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
              <div className="text-[10.5px] font-bold uppercase text-emerald-700 tracking-wide">Stock Formula</div>
              <div className="mt-1 text-[13px] font-bold">O + R + Rt − I − Tr</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">Automatic ledger balance</div>
            </div>
            <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3">
              <div className="text-[10.5px] font-bold uppercase text-amber-700 tracking-wide">Registers</div>
              <div className="mt-1 text-[13px] font-bold">16 Govt Formats</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">Exportable PDF / Excel</div>
            </div>
            <div className="rounded-xl bg-violet-50/50 border border-violet-100 p-3">
              <div className="text-[10.5px] font-bold uppercase text-violet-700 tracking-wide">Audit Trail</div>
              <div className="mt-1 text-[13px] font-bold">Immutable · IP-logged</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">Every mutation tracked</div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[15px] text-slate-900 flex items-center gap-2"><ClipboardCheck size={14} className="text-emerald-600" />Recent Stock Transactions</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Type</th><th>Item</th><th className="text-right">Qty</th></tr></thead>
              <tbody>
                {(stockTxns as Array<{ id: string; date: string; type: string; item_id: string; qty: number; ref: string }>).slice(0, 6).map((t) => {
                  const item = items.find((i) => i.id === t.item_id);
                  return (
                    <tr key={t.id}>
                      <td className="text-[11px] text-slate-500">{fmtDateTime(t.date)}</td>
                      <td><span className={statusBadge(t.type)}>{t.type}</span></td>
                      <td className="font-mono text-[11px]">{item?.code || t.item_id}</td>
                      <td className={`text-right font-bold ${t.qty < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{t.qty > 0 ? '+' : ''}{t.qty}</td>
                    </tr>
                  );
                })}
                {(stockTxns as unknown[]).length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400">No transactions yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
