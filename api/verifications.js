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
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('verifications').select('*').order('date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { officer_id, officer_name, items, remarks } = req.body;
      const no = await nextNo('VER', '2026');
      const discrepancy = (items || []).reduce((s, i) => s + Math.abs(Number(i.diff) || 0), 0);
      const { data, error } = await supabase.from('verifications').insert({ no, date: new Date().toISOString(), officer_id, officer_name, items, remarks: remarks || '', status: 'Pending Approval', discrepancy }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, action } = req.body;
      const { data, error } = await supabase.from('verifications').update({ status: action === 'approve' ? 'Approved' : 'Rejected' }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
