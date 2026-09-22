import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const [depts, trades, cats, units, locs, vendors] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('trades').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('units').select('*').order('name'),
        supabase.from('locations').select('*').order('name'),
        supabase.from('vendors').select('*').order('name'),
      ]);
      return res.status(200).json({
        departments: depts.data || [],
        trades: trades.data || [],
        categories: cats.data || [],
        units: units.data || [],
        locations: locs.data || [],
        vendors: vendors.data || [],
      });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
