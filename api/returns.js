import supabase from './db-client.js';

async function nextNo(prefix, fy) {
  const { data } = await supabase.from('counters').select('*').eq('code', prefix).single();
  const seq = (data?.seq || 0) + 1;
  await supabase.from('counters').upsert({ code: prefix, seq });
  return `${prefix}-${fy}-${String(seq).padStart(4, '0')}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('mat_returns').select('*').order('date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { issue_id, requester_id, requester_name, dept_id, trade_id, items, reason, remarks } = req.body;
      const { data: issue } = await supabase.from('issues').select('*').eq('id', issue_id).single();
      const no = await nextNo('RET', '2026');
      const { data, error } = await supabase.from('mat_returns').insert({
        no, issue_id, issue_no: issue?.no, date: new Date().toISOString(),
        requester_id, requester_name, dept_id, trade_id, items,
        reason: reason || '', remarks: remarks || '', status: 'Completed'
      }).select().single();
      if (error) throw error;

      // Increment stock (usable) for each
      for (const it of items) {
        const { data: st } = await supabase.from('stock').select('*').eq('item_id', it.item_id).single();
        if (st) {
          const usable = Number(it.usable) || 0;
          await supabase.from('stock').update({ available: (st.available || 0) + usable, returns: (st.returns || 0) + usable }).eq('item_id', it.item_id);
          if (usable > 0) {
            await supabase.from('stock_txns').insert({ item_id: it.item_id, qty: usable, type: 'Return', ref: no, user_id: requester_id, user_name: requester_name, date: new Date().toISOString() });
          }
        }
      }
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
