import { Shell } from '../components/Shell';

export default function Transfers() {
  return (
    <Shell title="Stock Transfers" subtitle="Move stock between store locations">
      <div className="card p-8 text-center">
        <div className="text-[15px] font-bold text-slate-700">Stock Transfers</div>
        <p className="text-[12.5px] text-slate-500 mt-1">Location-to-location transfers with Principal approval. Records maintained in Stock Transfer Register.</p>
        <div className="mt-3 text-[11.5px] text-slate-400">Transfers are captured through GRN receipts and manual stock adjustments in this implementation.</div>
      </div>
    </Shell>
  );
}
