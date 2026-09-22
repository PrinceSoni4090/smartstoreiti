import { Shell } from '../components/Shell';
import { useAuth } from '../contexts/AuthContext';
import { Settings2, Building2, Calendar, Bell, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { staff } = useAuth();
  return (
    <Shell title="System Settings" subtitle="Institute profile, financial year, workflow rules and notifications">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Building2 size={16} className="text-blue-700" /><h3 className="font-bold text-[15px]">Institute Profile</h3></div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Institute</span><span className="font-semibold">Government ITI Raigarh</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Institute (Hindi)</span><span className="font-dev font-semibold">शासकीय औद्योगिक प्रशिक्षण संस्था रायगड़़</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Code</span><span className="font-mono">CG-ITI-RG-01</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Address</span><span>Kelo Vihar, Raigarh, Chhattisgarh 496001</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span>iti.raigarh@cg.gov.in</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Website</span><span>iti.raigarh.cg.gov.in</span></div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-blue-700" /><h3 className="font-bold text-[15px]">Financial Year & Numbering</h3></div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Current FY</span><span className="font-bold text-blue-700">2025-26</span></div>
            {[['REQ', 'Requisitions'], ['PO', 'Purchase Orders'], ['GRN', 'Goods Receipt'], ['ISS', 'Issue Slips'], ['RET', 'Returns'], ['AST', 'Assets'], ['PR', 'Purchase Reqs'], ['VER', 'Verifications']].map(([k, l]) => (
              <div key={k} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-mono text-[11.5px]">{k}-{'{'}FY{'}'}-{'{'}SEQ:4{'}'}</span></div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><ShieldCheck size={16} className="text-blue-700" /><h3 className="font-bold text-[15px]">Workflow & Compliance</h3></div>
          <div className="space-y-2 text-[13px]">
            <label className="flex items-center gap-2"><input type="checkbox" checked disabled />Principal final approval enforced <span className="text-red-500 font-bold">(critical rule)</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked disabled />Store In-Charge must verify stock before Principal</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked disabled />No issue permitted without Principal approval</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked disabled />Immutable audit trail for every mutation</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked />Allow negative stock (disabled by default)</label>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Bell size={16} className="text-blue-700" /><h3 className="font-bold text-[15px]">Notifications</h3></div>
          <div className="space-y-2 text-[13px]">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked />In-app notifications</label>
            <label className="flex items-center gap-2"><input type="checkbox" />Email alerts (SMTP not configured)</label>
            <label className="flex items-center gap-2"><input type="checkbox" />SMS alerts (Gateway not configured)</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked />Low stock reorder alerts</label>
          </div>
        </div>
      </div>

      <div className="mt-4 card p-5">
        <div className="flex items-center gap-2 mb-3"><Settings2 size={16} className="text-blue-700" /><h3 className="font-bold text-[15px]">Signed In As</h3></div>
        <div className="grid sm:grid-cols-4 gap-3 text-[13px]">
          <div><div className="text-slate-500 text-[11px] font-semibold uppercase">Name</div><div className="font-semibold">{staff?.name}</div></div>
          <div><div className="text-slate-500 text-[11px] font-semibold uppercase">Role</div><div className="font-semibold">{staff?.role}</div></div>
          <div><div className="text-slate-500 text-[11px] font-semibold uppercase">Email</div><div>{staff?.email}</div></div>
          <div><div className="text-slate-500 text-[11px] font-semibold uppercase">Username</div><div className="font-mono">{staff?.username}</div></div>
        </div>
      </div>
    </Shell>
  );
}
