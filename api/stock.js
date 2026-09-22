import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('stock_txns').select('*').order('date', { ascending: false }).limit(200);
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      // manual adjustment
      const { item_id, qty, type, ref, user_id, user_name } = req.body;
      const { data: st } = await supabase.from('stock').select('*').eq('item_id', item_id).single();
      const available = (st?.available || 0) + Number(qty);
      await supabase.from('stock').update({ available, adjustments: (st?.adjustments || 0) + Number(qty) }).eq('item_id', item_id);
      await supabase.from('stock_txns').insert({ item_id, qty, type: type || 'Adjustment', ref: ref || 'Manual', user_id, user_name, date: new Date().toISOString() });
      return res.status(201).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
