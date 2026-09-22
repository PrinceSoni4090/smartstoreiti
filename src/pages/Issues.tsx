import { Shell } from '../components/Shell';
import { useData } from '../contexts/DataContext';
import { fmtDate, statusBadge } from '../lib/format';
import { FileText } from 'lucide-react';

export default function Issues() {
  const { issues, items, matReqs } = useData();
  return (
    <Shell title="Material Issue Slips" subtitle="Stock auto-decreases after issue. Issue only permitted from approved requisitions.">
      <div className="card p-3 mb-3 flex justify-between items-center">
        <div className="text-[13px] font-semibold text-slate-700"><FileText size={14} className="inline mr-1" />{issues.length} Issue Slips</div>
        <div className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">⚠ No issue without Principal approval — enforced by RBAC</div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Issue No</th><th>Req No</th><th>Date</th><th>Items</th><th>Issued By</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((iss) => {
              const req = matReqs.find((r) => r.id === iss.req_id);
              return (
                <tr key={iss.id}>
                  <td className="font-mono font-bold">{iss.no}</td>
                  <td className="font-mono text-[11.5px]">{req?.no || iss.req_no || '-'}</td>
                  <td>{fmtDate(iss.date)}</td>
                  <td className="text-[11.5px]">
                    {iss.items?.map((it, i) => {
                      const item = items.find((x) => x.id === it.item_id);
                      return <span key={i} className="inline-block mr-2"><span className="font-mono">{item?.code}</span> × <b>{it.issued_qty}</b></span>;
                    })}
                  </td>
                  <td>{iss.issued_by_name}</td>
                  <td><span className={statusBadge(iss.status)}>{iss.status}</span></td>
                </tr>
              );
            })}
            {issues.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No issue slips yet</td></tr>}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
