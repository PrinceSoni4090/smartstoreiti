import { useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { fmtINR, statusBadge } from '../lib/format';
import { Search, Plus, Filter, Download, Edit3, BarChart3 } from 'lucide-react';
import { can } from '../lib/rbac';
import type { Item } from '../lib/types';

const empty: Partial<Item> = {
  code: '', name: '', description: '', cat_id: '', subcat: '', unit_id: '', brand: '', model: '', spec: '',
  hsn: '', min_qty: 0, max_qty: 0, reorder: 0, rate: 0, tax: 18, loc_id: '', status: 'Active', barcode: '',
};

export default function Inventory() {
  const { items, categories, units, locations, refreshItems, stockTxns } = useData();
  const { role } = useAuth();
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editItem, setEditItem] = useState<Partial<Item> | null>(null);
  const [ledgerItem, setLedgerItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (catFilter && it.cat_id !== catFilter) return false;
      if (locFilter && it.loc_id !== locFilter) return false;
      if (stockFilter === 'low' && !(it.stock && (it.stock.available || 0) <= (it.reorder || 0) && (it.stock.available || 0) > 0)) return false;
      if (stockFilter === 'out' && !(it.stock && (it.stock.available || 0) === 0)) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!(it.code.toLowerCase().includes(s) || it.name.toLowerCase().includes(s) || (it.brand || '').toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [items, q, catFilter, locFilter, stockFilter]);

  const totalValue = items.reduce((s, it) => s + (it.rate || 0) * (it.stock?.available || 0), 0);

  const save = async () => {
    if (!editItem?.code || !editItem?.name) { alert('Code and name are required'); return; }
    setSaving(true);
    try {
      if (editItem.id) {
        await fetch('/api/items', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) });
      } else {
        await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) });
      }
      await refreshItems();
      setEditItem(null);
    } catch (e) { alert('Save failed'); }
    setSaving(false);
  };

  const exportCSV = () => {
    const rows = [['Code', 'Name', 'Category', 'Available', 'Rate', 'Value'], ...filtered.map((it) => [
      it.code, it.name, categories.find((c) => c.id === it.cat_id)?.name || '',
      it.stock?.available || 0, it.rate, (it.stock?.available || 0) * it.rate
    ])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'inventory.csv'; a.click();
  };

  return (
    <Shell title="Inventory & Item Master" subtitle={`${items.length} items · Total stock value ${fmtINR(totalValue)}`}
      actions={can(role!, 'edit', 'inventory') ? (
        <button onClick={() => setEditItem({ ...empty })} className="btn btn-primary h-9 text-[12.5px]"><Plus size={14} />Add Item</button>
      ) : null}
    >
      <div className="card p-3 flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <input className="input input-sm pl-9" placeholder="Search code, name, brand…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <select className="input input-sm w-[170px]" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input input-sm w-[170px]" value={locFilter} onChange={(e) => setLocFilter(e.target.value)}>
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="input input-sm w-[130px]" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}>
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <button onClick={exportCSV} className="btn btn-ghost h-9 text-[12px]"><Download size={14} />Export</button>
        <button className="btn btn-ghost h-9 text-[12px]"><Filter size={14} />More</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Item</th>
              <th>Category</th>
              <th>Location</th>
              <th className="text-right">Available</th>
              <th className="text-right">Reorder</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Value</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const avail = it.stock?.available || 0;
              const isLow = avail <= (it.reorder || 0);
              return (
                <tr key={it.id}>
                  <td className="font-mono font-bold text-[11.5px]">{it.code}</td>
                  <td>
                    <div className="font-semibold text-slate-900">{it.name}</div>
                    <div className="text-[11px] text-slate-500">{it.brand} {it.model}</div>
                  </td>
                  <td>{categories.find((c) => c.id === it.cat_id)?.name || '-'}</td>
                  <td>{locations.find((l) => l.id === it.loc_id)?.name || '-'}</td>
                  <td className="text-right">
                    <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{avail}</span>
                    <span className="text-[10.5px] text-slate-400 ml-1">{units.find((u) => u.id === it.unit_id)?.symbol || ''}</span>
                  </td>
                  <td className="text-right text-slate-500">{it.reorder}</td>
                  <td className="text-right font-mono">{fmtINR(it.rate)}</td>
                  <td className="text-right font-semibold">{fmtINR(avail * it.rate)}</td>
                  <td>{isLow ? <span className="badge badge-amber">Low</span> : <span className={statusBadge(it.status)}>{it.status}</span>}</td>
                  <td className="text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setLedgerItem(it)} className="btn btn-ghost h-7 text-[11px] px-2" title="Stock Ledger"><BarChart3 size={12} /></button>
                      {can(role!, 'edit', 'inventory') && (
                        <button onClick={() => setEditItem(it)} className="btn btn-ghost h-7 text-[11px] px-2"><Edit3 size={12} />Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-10 text-slate-400">No items match the filter</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={editItem?.id ? 'Edit Item' : 'Add New Item'} subtitle="Item master data for inventory tracking" size="lg"
        footer={
          <>
            <button onClick={() => setEditItem(null)} className="btn btn-ghost h-9">Cancel</button>
            <button onClick={save} disabled={saving} className="btn btn-primary h-9">{saving ? 'Saving…' : editItem?.id ? 'Update' : 'Create Item'}</button>
          </>
        }
      >
        {editItem && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Item Code *"><input className="input" value={editItem.code || ''} onChange={(e) => setEditItem({ ...editItem, code: e.target.value })} placeholder="ITI-CONS-XXXX" /></Field>
            <Field label="HSN Code"><input className="input" value={editItem.hsn || ''} onChange={(e) => setEditItem({ ...editItem, hsn: e.target.value })} /></Field>
            <Field label="Item Name *" full><input className="input" value={editItem.name || ''} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></Field>
            <Field label="Description" full><textarea className="input" value={editItem.description || ''} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></Field>
            <Field label="Category *">
              <select className="input" value={editItem.cat_id || ''} onChange={(e) => setEditItem({ ...editItem, cat_id: e.target.value })}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Sub-category"><input className="input" value={editItem.subcat || ''} onChange={(e) => setEditItem({ ...editItem, subcat: e.target.value })} /></Field>
            <Field label="Unit *">
              <select className="input" value={editItem.unit_id || ''} onChange={(e) => setEditItem({ ...editItem, unit_id: e.target.value })}>
                <option value="">Select…</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
            </Field>
            <Field label="Default Location">
              <select className="input" value={editItem.loc_id || ''} onChange={(e) => setEditItem({ ...editItem, loc_id: e.target.value })}>
                <option value="">Select…</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Brand"><input className="input" value={editItem.brand || ''} onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })} /></Field>
            <Field label="Model"><input className="input" value={editItem.model || ''} onChange={(e) => setEditItem({ ...editItem, model: e.target.value })} /></Field>
            <Field label="Specification" full><input className="input" value={editItem.spec || ''} onChange={(e) => setEditItem({ ...editItem, spec: e.target.value })} /></Field>
            <Field label="Min Qty"><input type="number" className="input" value={editItem.min_qty || 0} onChange={(e) => setEditItem({ ...editItem, min_qty: Number(e.target.value) })} /></Field>
            <Field label="Max Qty"><input type="number" className="input" value={editItem.max_qty || 0} onChange={(e) => setEditItem({ ...editItem, max_qty: Number(e.target.value) })} /></Field>
            <Field label="Reorder Level"><input type="number" className="input" value={editItem.reorder || 0} onChange={(e) => setEditItem({ ...editItem, reorder: Number(e.target.value) })} /></Field>
            <Field label="Rate (₹)"><input type="number" className="input" value={editItem.rate || 0} onChange={(e) => setEditItem({ ...editItem, rate: Number(e.target.value) })} /></Field>
            <Field label="Tax (%)"><input type="number" className="input" value={editItem.tax || 0} onChange={(e) => setEditItem({ ...editItem, tax: Number(e.target.value) })} /></Field>
            <Field label="Barcode / SKU"><input className="input" value={editItem.barcode || ''} onChange={(e) => setEditItem({ ...editItem, barcode: e.target.value })} /></Field>
            <Field label="Status">
              <select className="input" value={editItem.status || 'Active'} onChange={(e) => setEditItem({ ...editItem, status: e.target.value as 'Active' | 'Inactive' })}>
                <option>Active</option><option>Inactive</option>
              </select>
            </Field>
          </div>
        )}
      </Modal>

      {/* Stock Ledger Modal */}
      <Modal open={!!ledgerItem} onClose={() => setLedgerItem(null)} title={ledgerItem ? `Stock Ledger — ${ledgerItem.code}` : ''} subtitle={ledgerItem?.name} size="lg">
        {ledgerItem && (() => {
          const st = ledgerItem.stock;
          const txns = (stockTxns as Array<{ id: string; item_id: string; date: string; type: string; qty: number; ref: string; user_name: string }>).filter((t) => t.item_id === ledgerItem.id);
          return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {[
                  { l: 'Opening', v: st?.opening || 0 },
                  { l: 'Receipts', v: st?.receipts || 0 },
                  { l: 'Returns', v: st?.returns || 0 },
                  { l: 'Issues', v: st?.issues || 0 },
                  { l: 'Transfer In', v: st?.transfer_in || 0 },
                  { l: 'Transfer Out', v: st?.transfer_out || 0 },
                  { l: 'Adjustments', v: st?.adjustments || 0 },
                  { l: 'AVAILABLE', v: st?.available || 0, hi: true },
                ].map((c) => (
                  <div key={c.l} className={`rounded-xl border p-2.5 ${c.hi ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide">{c.l}</div>
                    <div className={`mt-0.5 text-[16px] font-bold ${c.hi ? 'text-blue-700' : 'text-slate-900'}`}>{c.v}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mb-2">Formula: Opening + Receipts + Returns + Transfer In − Issues − Transfer Out ± Adjustments</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Type</th><th className="text-right">Qty</th><th>Reference</th><th>User</th></tr></thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                        <td><span className={statusBadge(t.type)}>{t.type}</span></td>
                        <td className={`text-right font-bold ${t.qty < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{t.qty > 0 ? '+' : ''}{t.qty}</td>
                        <td className="font-mono text-[11px]">{t.ref}</td>
                        <td>{t.user_name}</td>
                      </tr>
                    ))}
                    {txns.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No transactions</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </Modal>
    </Shell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="text-[11.5px] font-semibold text-slate-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
