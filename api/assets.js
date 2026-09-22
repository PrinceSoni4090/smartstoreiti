import supabase from './db-client.js';

async function nextNo(prefix, fy) {
  const { data } = await supabase.from('counters').select('*').eq('code', prefix).single();
  const seq = (data?.seq || 0) + 1;
  await supabase.from('counters').upsert({ code: prefix, seq });
  return `${prefix}-${fy}-${String(seq).padStart(4, '0')}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('assets').select('*').order('code');
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const body = req.body;
      if (!body.code) body.code = await nextNo('AST', '2026');
      if (!body.qr) body.qr = body.code;
      const { data, error } = await supabase.from('assets').insert(body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...upd } = req.body;
      const { data, error } = await supabase.from('assets').update(upd).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
