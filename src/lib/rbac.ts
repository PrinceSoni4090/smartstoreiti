import type { Role } from './types';

// Role → allowed navigation modules
export const NAV_ACCESS: Record<Role, string[]> = {
  'Super Admin': ['dashboard', 'inventory', 'requisition', 'issue', 'return', 'transfer', 'procurement', 'assets', 'verification', 'registers', 'reports', 'notifications', 'users', 'audit', 'settings'],
  'Principal': ['dashboard', 'requisition', 'procurement', 'inventory', 'assets', 'reports', 'registers', 'notifications', 'audit'],
  'Store In-Charge': ['dashboard', 'inventory', 'requisition', 'issue', 'return', 'transfer', 'procurement', 'assets', 'verification', 'registers', 'reports', 'notifications'],
  'Instructor/Staff': ['dashboard', 'requisition', 'issue', 'return', 'assets', 'notifications'],
  'Department/Trade Head': ['dashboard', 'requisition', 'inventory', 'reports', 'registers', 'notifications'],
  'Auditor/Viewer': ['dashboard', 'inventory', 'requisition', 'registers', 'reports', 'audit', 'assets', 'notifications'],
};

export const can = (role: Role, action: string, module: string): boolean => {
  if (role === 'Super Admin') return true;
  if (module === 'requisition') {
    if (action === 'create') return ['Instructor/Staff', 'Department/Trade Head', 'Store In-Charge'].includes(role);
    if (action === 'verify') return role === 'Store In-Charge';
    if (action === 'approve') return role === 'Principal';
    if (action === 'issue') return role === 'Store In-Charge';
  }
  if (module === 'inventory' && action === 'edit') return role === 'Store In-Charge';
  if (module === 'assets' && action === 'edit') return role === 'Store In-Charge';
  if (module === 'procurement' && (action === 'edit' || action === 'create')) return role === 'Store In-Charge' || role === 'Principal';
  if (module === 'users') return false; // Only Super Admin
  return NAV_ACCESS[role]?.includes(module) || false;
};
