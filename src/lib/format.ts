export const fmtINR = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(Number(n))) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (d: string | null | undefined) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const relTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return fmtDate(d);
};

export const statusBadge = (s: string): string => {
  const map: Record<string, string> = {
    'Approved': 'badge badge-green',
    'Issued': 'badge badge-green',
    'Completed': 'badge badge-green',
    'Received': 'badge badge-green',
    'Active': 'badge badge-green',
    'Available': 'badge badge-green',
    'In Use': 'badge badge-blue',
    'Assigned': 'badge badge-blue',
    'Pending': 'badge badge-amber',
    'Pending Verification': 'badge badge-amber',
    'Pending Principal Approval': 'badge badge-amber',
    'Pending Approval': 'badge badge-amber',
    'Partially Received': 'badge badge-amber',
    'Under Repair': 'badge badge-amber',
    'Rejected': 'badge badge-red',
    'Disabled': 'badge badge-red',
    'Damaged': 'badge badge-red',
    'Dispatched': 'badge badge-violet',
    'Requested': 'badge badge-slate',
    'Returned for Correction': 'badge badge-red',
    'Super Admin': 'badge badge-violet',
    'Principal': 'badge badge-blue',
    'Store In-Charge': 'badge badge-green',
    'Instructor/Staff': 'badge badge-amber',
    'Department/Trade Head': 'badge badge-slate',
    'Auditor/Viewer': 'badge badge-slate',
  };
  return map[s] || 'badge badge-slate';
};

export const priorityBadge = (p: string): string => {
  const map: Record<string, string> = {
    Urgent: 'badge badge-red',
    High: 'badge badge-amber',
    Medium: 'badge badge-blue',
    Low: 'badge badge-slate',
  };
  return map[p] || 'badge badge-slate';
};
