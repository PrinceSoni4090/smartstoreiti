import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Department, Trade, Category, Unit, Location, Vendor, Item, MatReq, Issue, Asset, Notification, AuditEntry, Staff } from '../lib/types';

interface DataContextValue {
  departments: Department[]; trades: Trade[]; categories: Category[]; units: Unit[]; locations: Location[]; vendors: Vendor[];
  items: Item[]; matReqs: MatReq[]; issues: Issue[]; assets: Asset[];
  notifications: Notification[]; audit: AuditEntry[]; staff: Staff[];
  procurement: { purchase_reqs: unknown[]; purchase_orders: unknown[]; grns: unknown[] };
  stockTxns: unknown[]; returns: unknown[]; verifications: unknown[];
  loading: boolean;
  refresh: () => Promise<void>;
  refreshItems: () => Promise<void>;
  refreshReqs: () => Promise<void>;
  refreshIssues: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({} as DataContextValue);

export function DataProvider({ children }: { children: ReactNode }) {
  const [masters, setMasters] = useState<Omit<DataContextValue, 'items' | 'matReqs' | 'issues' | 'assets' | 'notifications' | 'audit' | 'staff' | 'procurement' | 'stockTxns' | 'returns' | 'verifications' | 'loading' | 'refresh' | 'refreshItems' | 'refreshReqs' | 'refreshIssues' | 'refreshNotifications'>>({
    departments: [], trades: [], categories: [], units: [], locations: [], vendors: [],
  });
  const [items, setItems] = useState<Item[]>([]);
  const [matReqs, setMatReqs] = useState<MatReq[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [procurement, setProcurement] = useState({ purchase_reqs: [], purchase_orders: [], grns: [] });
  const [stockTxns, setStockTxns] = useState<unknown[]>([]);
  const [returns, setReturns] = useState<unknown[]>([]);
  const [verifications, setVerifications] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshItems = useCallback(async () => {
    const r = await fetch('/api/items').then(r => r.json());
    setItems(Array.isArray(r) ? r : []);
  }, []);
  const refreshReqs = useCallback(async () => {
    const r = await fetch('/api/requisitions').then(r => r.json());
    setMatReqs(Array.isArray(r) ? r : []);
  }, []);
  const refreshIssues = useCallback(async () => {
    const r = await fetch('/api/issues').then(r => r.json());
    setIssues(Array.isArray(r) ? r : []);
  }, []);
  const refreshNotifications = useCallback(async () => {
    const r = await fetch('/api/notifications').then(r => r.json());
    setNotifications(Array.isArray(r) ? r : []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, i, r, is, as, no, au, st, pr, ret, ver, stx] = await Promise.all([
        fetch('/api/masters').then(x => x.json()),
        fetch('/api/items').then(x => x.json()),
        fetch('/api/requisitions').then(x => x.json()),
        fetch('/api/issues').then(x => x.json()),
        fetch('/api/assets').then(x => x.json()),
        fetch('/api/notifications').then(x => x.json()),
        fetch('/api/audit').then(x => x.json()),
        fetch('/api/staff').then(x => x.json()),
        fetch('/api/procurement').then(x => x.json()),
        fetch('/api/returns').then(x => x.json()),
        fetch('/api/verifications').then(x => x.json()),
        fetch('/api/stock').then(x => x.json()),
      ]);
      setMasters(m);
      setItems(Array.isArray(i) ? i : []);
      setMatReqs(Array.isArray(r) ? r : []);
      setIssues(Array.isArray(is) ? is : []);
      setAssets(Array.isArray(as) ? as : []);
      setNotifications(Array.isArray(no) ? no : []);
      setAudit(Array.isArray(au) ? au : []);
      setStaff(Array.isArray(st) ? st : []);
      setProcurement(pr || { purchase_reqs: [], purchase_orders: [], grns: [] });
      setReturns(Array.isArray(ret) ? ret : []);
      setVerifications(Array.isArray(ver) ? ver : []);
      setStockTxns(Array.isArray(stx) ? stx : []);
    } catch (e) {
      console.error('Data refresh failed', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <DataContext.Provider value={{ ...masters, items, matReqs, issues, assets, notifications, audit, staff, procurement, stockTxns, returns, verifications, loading, refresh, refreshItems, refreshReqs, refreshIssues, refreshNotifications }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
