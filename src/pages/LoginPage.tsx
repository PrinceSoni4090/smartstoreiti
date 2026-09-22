import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { GovtEmblem, ItiLogo, SkillIndia } from '../components/GovLogo';
import { CheckCircle2, ShieldCheck, Workflow } from 'lucide-react';

const DEMO_ACCOUNTS: { key: string; label: string; email: string; pass: string; role: string }[] = [
  { key: 'superadmin', label: 'Super Admin', email: 'admin@itiraigarh.cg.gov.in', pass: 'Admin@123', role: 'Super Admin' },
  { key: 'principal', label: 'Principal', email: 'principal@itiraigarh.cg.gov.in', pass: 'Principal@123', role: 'Principal' },
  { key: 'store', label: 'Store In-Charge', email: 'store@itiraigarh.cg.gov.in', pass: 'Store@123', role: 'Store In-Charge' },
  { key: 'instructor', label: 'Instructor', email: 'amit.verma@itiraigarh.cg.gov.in', pass: 'Instructor@123', role: 'Instructor/Staff' },
  { key: 'hod', label: 'Trade Head', email: 'ml.sahu@itiraigarh.cg.gov.in', pass: 'Hod@123', role: 'Department/Trade Head' },
  { key: 'auditor', label: 'Auditor', email: 'audit@cg.gov.in', pass: 'Auditor@123', role: 'Auditor/Viewer' },
];

export default function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Loading…</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email || !password) { setErr('Enter username & password'); return; }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setErr((e as Error).message || 'Login failed');
    }
    setBusy(false);
  };

  const fill = (d: typeof DEMO_ACCOUNTS[0]) => { setEmail(d.email); setPassword(d.pass); setErr(''); };

  return (
    <div className="min-h-screen flex flex-col gov-hero">
      {/* Top nav — official three-logo lockup (Govt of Chhattisgarh · ITI · Skill India) */}
      <div className="gov-topbar">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <GovtEmblem size={52} showCaption />
            <div className="h-12 w-px bg-slate-200" />
            <ItiLogo size={52} showCaption />
            <div className="h-12 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block"><SkillIndia size={40} showCaption /></div>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-[11px] tracking-widest font-bold text-slate-500 uppercase">Government of Chhattisgarh</div>
            <div className="text-[11px] text-slate-500">Dept. of Technical Education & Skill Development</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">CG-ITI-RG-01 · Raigarh</div>
          </div>
        </div>
        <div className="tricolor h-1" />
      </div>

      <div className="flex-1 grid place-items-center px-4 py-8 sm:py-10">
        <div className="w-full max-w-[1100px] grid lg:grid-cols-[1.15fr_.85fr] gap-6 items-stretch">
          {/* Left: hero */}
          <div className="card p-6 sm:p-8 lg:p-10 flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold tracking-wide text-blue-700 uppercase">
                  <ShieldCheck size={12} /> Secure Government Portal • Raigarh
                </div>
                <h1 className="mt-4 text-[26px] sm:text-[32px] leading-[1.05] font-bold tracking-tight text-slate-900">
                  Government ITI Raigarh<br />
                  <span className="text-[#1d4ed8]">Smart Store Management System</span>
                </h1>
                <p className="mt-2 font-dev text-[17px] leading-tight font-medium text-slate-700">
                  शासकीय औद्योगिक प्रशिक्षण संस्था रायगढ़ – स्मार्ट स्टोर प्रबंधन प्रणाली
                </p>
                <p className="mt-4 text-[13.5px] leading-6 text-slate-600 max-w-[56ch]">
                  Complete inventory, procurement, material issue, assets, statutory registers, audit trail & RBAC workflow with
                  Principal-mandated final approval. Built for transparency and government compliance.
                </p>
              </div>
              <div className="hidden sm:grid w-14 h-14 rounded-2xl bg-slate-900 text-white place-items-center text-[10px] font-bold leading-none text-center">
                ITI<br />RG
              </div>
            </div>

            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#f8fafc] border border-slate-200 p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Stock Accuracy</div>
                <div className="mt-1 text-[18px] font-bold">100% Ledger</div>
                <div className="text-[12px] text-slate-500">Opening + Receipts − Issues + Returns enforced</div>
              </div>
              <div className="rounded-xl bg-[#f8fafc] border border-slate-200 p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Workflow</div>
                <div className="mt-1 text-[18px] font-bold">4-Step Approval</div>
                <div className="text-[12px] text-slate-500">Instructor → Store → Principal → Issue</div>
              </div>
              <div className="rounded-xl bg-[#f8fafc] border border-slate-200 p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Compliance</div>
                <div className="mt-1 text-[18px] font-bold">Govt Registers</div>
                <div className="text-[12px] text-slate-500">16 registers • Reports • Audit trail</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="badge badge-blue">RBAC • 6 Roles</span>
              <span className="badge badge-slate">QR / Barcode</span>
              <span className="badge badge-slate">GRN Auto-Stock</span>
              <span className="badge badge-slate">No Issue Without Approval</span>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid gap-2 text-[12.5px] text-slate-600">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" />Digital sanction register aligned with government norms</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" />Immutable audit log for every action</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /><Workflow size={12} className="text-emerald-600" />Principal-final approval is strictly enforced by RBAC</div>
            </div>

            <div className="mt-auto pt-6 text-[11px] text-slate-500">
              Demo data seeded: departments, 8 trades, categories, 32 items, 18 assets, vendors, stock ledger, requisitions & audit log.
            </div>
          </div>

          {/* Right: login form */}
          <div className="card p-6 sm:p-7">
            {/* Official three-logo lockup at top of the card */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pb-4 mb-4 border-b border-slate-100">
              <GovtEmblem size={44} />
              <div className="h-10 w-px bg-slate-200" />
              <ItiLogo size={44} />
              <div className="h-10 w-px bg-slate-200" />
              <SkillIndia size={36} />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[18px]">Secure Sign In</h2>
              <span className="text-[10.5px] px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold uppercase tracking-wider">Encrypted</span>
            </div>
            <p className="mt-1 text-[12.5px] text-slate-500">Use the demo accounts below or your credentials. All logins are audited.</p>
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="text-[12px] font-semibold text-slate-600">Email / Username</label>
                <input className="input mt-1" placeholder="e.g. principal@itiraigarh.cg.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-600">Password</label>
                <input type="password" className="input mt-1" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              {err && <div className="text-[12px] p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">{err}</div>}
              <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center h-[44px]">
                {busy ? 'Signing in…' : 'Sign in to Dashboard'}
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {DEMO_ACCOUNTS.map((d) => (
                  <button key={d.key} type="button" onClick={() => fill(d)} className="btn btn-ghost h-9 text-[11.5px]">{d.label}</button>
                ))}
              </div>
            </form>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
              <div className="flex justify-between"><span>admin@itiraigarh.cg.gov.in</span><span className="text-slate-400">Admin@123</span></div>
              <div className="flex justify-between"><span>principal@itiraigarh.cg.gov.in</span><span className="text-slate-400">Principal@123</span></div>
              <div className="flex justify-between"><span>store@itiraigarh.cg.gov.in</span><span className="text-slate-400">Store@123</span></div>
              <div className="flex justify-between"><span>amit.verma@itiraigarh.cg.gov.in</span><span className="text-slate-400">Instructor@123</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center text-[11px] text-slate-500 gap-2">
          <span>© Government of Chhattisgarh • Department of Technical Education & Skill Development</span>
          <span>Financial Year 2025-26 • Government ITI Raigarh (CG-ITI-RG-01)</span>
        </div>
      </div>
    </div>
  );
}
