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

async function notify(type, title, message, for_role, link) {
  await supabase.from('notifications').insert({ type, title, message, for_role, link, read: false });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('mat_reqs').select('*').order('date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { dept_id, trade_id, requester_id, requester_name, items, purpose, required_date, priority, remarks } = req.body;
      const no = await nextNo('REQ', '2026');
      const history = [{ at: new Date().toISOString(), by: requester_id, by_name: requester_name, action: 'Created', note: 'Request created' }];
      const { data, error } = await supabase.from('mat_reqs').insert({
        no, date: new Date().toISOString(), dept_id, trade_id, requester_id, requester_name,
        items, purpose, required_date, priority: priority || 'Medium', status: 'Pending Verification',
        remarks: remarks || '', history
      }).select().single();
      if (error) throw error;
      await log('CREATE', 'Material Requisition', data.id, requester_id, requester_name, null, { no });
      await notify('requisition', 'New Requisition', `${no} created by ${requester_name}`, 'Store In-Charge', 'requisition');
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, action, user_id, user_name, user_role, note, items } = req.body;
      const { data: reqData } = await supabase.from('mat_reqs').select('*').eq('id', id).single();
      if (!reqData) return res.status(404).json({ error: 'Not found' });
      const history = reqData.history || [];
      let status = reqData.status;
      let update = {};

      if (action === 'verify') {
        if (user_role !== 'Store In-Charge' && user_role !== 'Super Admin') return res.status(403).json({ error: 'Only Store In-Charge can verify' });
        status = 'Pending Principal Approval';
        history.push({ at: new Date().toISOString(), by: user_id, by_name: user_name, action: 'Verified', note: note || 'Stock verified, forwarded to Principal' });
        await notify('approval', 'Requisition awaiting approval', `${reqData.no} awaits Principal approval`, 'Principal', 'requisition');
      } else if (action === 'approve') {
        if (user_role !== 'Principal' && user_role !== 'Super Admin') return res.status(403).json({ error: 'Only Principal can approve final (RBAC enforced)' });
        status = 'Approved';
        history.push({ at: new Date().toISOString(), by: user_id, by_name: user_name, action: 'Approved', note: note || 'Final approval by Principal' });
        await notify('approval', 'Requisition Approved', `${reqData.no} approved. Store may issue.`, 'Store In-Charge', 'requisition');
      } else if (action === 'partial') {
        if (user_role !== 'Principal' && user_role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
        status = 'Approved';
        if (items) update.items = items;
        history.push({ at: new Date().toISOString(), by: user_id, by_name: user_name, action: 'Partial Approved', note: note || 'Partially approved' });
      } else if (action === 'reject') {
        status = 'Rejected';
        history.push({ at: new Date().toISOString(), by: user_id, by_name: user_name, action: 'Rejected', note: note || 'Rejected' });
      } else if (action === 'return') {
        status = 'Returned for Correction';
        history.push({ at: new Date().toISOString(), by: user_id, by_name: user_name, action: 'Returned', note: note || 'Sent back' });
      }
      update.status = status;
      update.history = history;
      const { data, error } = await supabase.from('mat_reqs').update(update).eq('id', id).select().single();
      if (error) throw error;
      await log(action.toUpperCase(), 'Material Requisition', id, user_id, user_name, { status: reqData.status }, { status });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('mat_reqs').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
