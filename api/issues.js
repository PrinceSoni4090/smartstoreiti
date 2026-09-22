import supabase from './db-client.js';

async function nextNo(prefix, fy) {
  const { data } = await supabase.from('counters').select('*').eq('code', prefix).single();
  const seq = (data?.seq || 0) + 1;
  await supabase.from('counters').upsert({ code: prefix, seq });
  return `${prefix}-${fy}-${String(seq).padStart(4, '0')}`;
}

async function log(action, module_name, record_id, user_id, user_name, oldV, newV) {
  await supabase.from('audit_log').insert({ action, module: module_name, record_id, user_id, user_name, old_value: oldV, new_value: newV, ip: '127.0.0.1' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('issues').select('*').order('date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      // Create issue slip from approved requisition
      const { req_id, user_id, user_name, user_role } = req.body;
      if (user_role !== 'Store In-Charge' && user_role !== 'Super Admin') return res.status(403).json({ error: 'Only Store can issue' });
      const { data: reqData } = await supabase.from('mat_reqs').select('*').eq('id', req_id).single();
      if (!reqData) return res.status(404).json({ error: 'Requisition not found' });
      if (reqData.status !== 'Approved') return res.status(400).json({ error: 'No issue without Principal approval' });

      const items = (reqData.items || []).map(it => ({ item_id: it.item_id, req_qty: it.qty, issued_qty: it.qty }));
      const no = await nextNo('ISS', '2026');
      const { data: issue, error } = await supabase.from('issues').insert({
        no, req_id, req_no: reqData.no, date: new Date().toISOString(),
        issued_by: user_id, issued_by_name: user_name, items, status: 'Completed', remarks: ''
      }).select().single();
      if (error) throw error;

      // Decrement stock atomically for each item
      for (const it of items) {
        const { data: st } = await supabase.from('stock').select('*').eq('item_id', it.item_id).single();
        if (st) {
          const newAvail = Math.max(0, (st.available || 0) - it.issued_qty);
          await supabase.from('stock').update({ available: newAvail, issues: (st.issues || 0) + it.issued_qty }).eq('item_id', it.item_id);
          await supabase.from('stock_txns').insert({ item_id: it.item_id, qty: -it.issued_qty, type: 'Issue', ref: no, user_id, user_name, date: new Date().toISOString() });
        }
      }

      // Update req status
      const history = reqData.history || [];
      history.push({ at: new Date().toISOString(), by: user_id, by_name: user_name, action: 'Issued', note: no });
      await supabase.from('mat_reqs').update({ status: 'Issued', history }).eq('id', req_id);

      await log('ISSUE', 'Material Issue', issue.id, user_id, user_name, null, { no });
      return res.status(201).json(issue);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
