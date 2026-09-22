import supabase from './db-client.js';

async function nextNo(prefix, fy) {
  const { data } = await supabase.from('counters').select('*').eq('code', prefix).single();
  const seq = (data?.seq || 0) + 1;
  await supabase.from('counters').upsert({ code: prefix, seq });
  return `${prefix}-${fy}-${String(seq).padStart(4, '0')}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const kind = req.query.kind || req.body?.kind;

    if (req.method === 'GET') {
      const [pr, po, grn] = await Promise.all([
        supabase.from('purchase_reqs').select('*').order('date', { ascending: false }),
        supabase.from('purchase_orders').select('*').order('date', { ascending: false }),
        supabase.from('grns').select('*').order('date', { ascending: false }),
      ]);
      return res.status(200).json({ purchase_reqs: pr.data || [], purchase_orders: po.data || [], grns: grn.data || [] });
    }

    if (req.method === 'POST' && kind === 'pr') {
      const { dept_id, trade_id, requester_id, requester_name, items, total, purpose, priority } = req.body;
      const no = await nextNo('PR', '2026');
      const { data, error } = await supabase.from('purchase_reqs').insert({ no, date: new Date().toISOString(), dept_id, trade_id, requester_id, requester_name, items, total, purpose, priority: priority || 'Medium', status: 'Pending' }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'POST' && kind === 'po') {
      const { pr_id, vendor_id, items, sub_total, tax_total, grand_total, delivery_date, terms } = req.body;
      const no = await nextNo('PO', '2026');
      const { data, error } = await supabase.from('purchase_orders').insert({ no, pr_id, vendor_id, date: new Date().toISOString(), items, sub_total, tax_total, grand_total, delivery_date, terms: terms || '', status: 'Issued' }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'POST' && kind === 'grn') {
      const { po_id, vendor_id, invoice_no, items, remarks, user_id, user_name } = req.body;
      const no = await nextNo('GRN', '2026');
      const { data, error } = await supabase.from('grns').insert({ no, po_id, vendor_id, invoice_no, date: new Date().toISOString(), items, remarks: remarks || '', status: 'Completed' }).select().single();
      if (error) throw error;
      // Increment stock for each accepted qty
      for (const it of items) {
        const accepted = Number(it.accepted) || 0;
        if (accepted > 0) {
          const { data: st } = await supabase.from('stock').select('*').eq('item_id', it.item_id).single();
          if (st) {
            await supabase.from('stock').update({ available: (st.available || 0) + accepted, receipts: (st.receipts || 0) + accepted }).eq('item_id', it.item_id);
          } else {
            await supabase.from('stock').insert({ item_id: it.item_id, opening: 0, receipts: accepted, issues: 0, returns: 0, transfer_in: 0, transfer_out: 0, adjustments: 0, available: accepted, reserved: 0 });
          }
          await supabase.from('stock_txns').insert({ item_id: it.item_id, qty: accepted, type: 'Receipt', ref: no, user_id, user_name, date: new Date().toISOString() });
        }
      }
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' && kind === 'pr') {
      const { id, status } = req.body;
      const { data, error } = await supabase.from('purchase_reqs').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
