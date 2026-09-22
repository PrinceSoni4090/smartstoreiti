import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data: items, error: e1 } = await supabase.from('items').select('*').order('code');
      if (e1) throw e1;
      const { data: stock, error: e2 } = await supabase.from('stock').select('*');
      if (e2) throw e2;
      const stockMap = Object.fromEntries((stock || []).map(s => [s.item_id, s]));
      const merged = (items || []).map(it => ({ ...it, stock: stockMap[it.id] || null }));
      return res.status(200).json(merged);
    }
    if (req.method === 'POST') {
      const body = req.body;
      const { data, error } = await supabase.from('items').insert(body).select().single();
      if (error) throw error;
      // Initialize stock row
      await supabase.from('stock').insert({ item_id: data.id, opening: 0, receipts: 0, issues: 0, returns: 0, transfer_in: 0, transfer_out: 0, adjustments: 0, available: 0, reserved: 0 });
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...upd } = req.body;
      const { data, error } = await supabase.from('items').update(upd).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('stock').delete().eq('item_id', id);
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
