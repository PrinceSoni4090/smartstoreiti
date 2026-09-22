export type Role = 'Super Admin' | 'Principal' | 'Store In-Charge' | 'Instructor/Staff' | 'Department/Trade Head' | 'Auditor/Viewer';

export interface Staff {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  dept_id: string | null;
  trade_id: string | null;
  phone: string;
  status: 'Active' | 'Disabled';
  last_login: string | null;
}

export interface Department { id: string; name: string; code: string; hod: string; }
export interface Trade { id: string; name: string; dept_id: string; code: string; }
export interface Category { id: string; name: string; code: string; sub: string[]; }
export interface Unit { id: string; name: string; symbol: string; }
export interface Location { id: string; name: string; type: string; code: string; }
export interface Vendor { id: string; code: string; name: string; gst: string; contact: string; phone: string; email: string; address: string; rating: number; }
export interface Item {
  id: string; code: string; name: string; description: string; cat_id: string; subcat: string;
  unit_id: string; brand: string; model: string; spec: string; hsn: string;
  min_qty: number; max_qty: number; reorder: number; rate: number; tax: number;
  loc_id: string; status: 'Active' | 'Inactive'; barcode: string;
  stock?: Stock | null;
}
export interface Stock {
  item_id: string; opening: number; receipts: number; issues: number; returns: number;
  transfer_in: number; transfer_out: number; adjustments: number; available: number; reserved: number;
}

export interface ReqItem { item_id: string; qty: number; available?: number; purpose?: string; }
export interface HistoryEntry { at: string; by: string; by_name: string; action: string; note?: string; }
export interface MatReq {
  id: string; no: string; date: string; dept_id: string; trade_id: string;
  requester_id: string; requester_name: string; items: ReqItem[];
  purpose: string; required_date: string; priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: string; remarks: string; history: HistoryEntry[];
}

export interface Issue { id: string; no: string; req_id: string; req_no: string; date: string; issued_by: string; issued_by_name: string; items: { item_id: string; req_qty: number; issued_qty: number }[]; status: string; remarks: string; }
export interface Asset { id: string; code: string; name: string; cat: string; make: string; model: string; serial: string; purchase_date: string; po_id: string | null; vendor_id: string | null; cost: number; warranty_till: string; loc_id: string; dept_id: string; assigned_to: string | null; condition: string; status: string; qr: string; }

export interface Notification { id: number; type: string; title: string; message: string; created_at: string; read: boolean; for_role: string; link: string; }
export interface AuditEntry { id: number; action: string; module: string; record_id: string; user_id: string; user_name: string; old_value: unknown; new_value: unknown; ip: string; created_at: string; }
