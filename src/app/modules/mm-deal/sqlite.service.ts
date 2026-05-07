import { Injectable } from '@angular/core';
import { MmDealPayload } from './mm-deal-api.service';

export interface StoredDeal extends MmDealPayload {
  status: string;
  createdAt: string;
}

export interface DealStats {
  totalDeals: number;
  totalFaceValue: number;
  byStatus: Record<string, number>;
  recentDeals: StoredDeal[];
}

// TODO: replace localStorage fallback with real SQLite/API persistence when backend is ready
const LS_KEY = 'tms_mm_deals';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private store: StoredDeal[] = this.loadFromStorage();

  private loadFromStorage(): StoredDeal[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as StoredDeal[]) : [];
    } catch { return []; }
  }

  private persist(): void {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.store)); } catch { /* quota exceeded */ }
  }

  insertDeal(payload: MmDealPayload): { dealId: string } {
    this.store.push({ ...payload, status: 'SAVED', createdAt: new Date().toISOString() });
    this.persist();
    return { dealId: payload.dealId };
  }

  getPendingDeals(): StoredDeal[] {
    return this.store.filter(d => d.status === 'SAVED');
  }

  getAllDeals(): StoredDeal[] {
    return [...this.store];
  }

  getDealStats(): DealStats {
    const total = this.store.length;
    const totalFaceValue = this.store.reduce((sum, d) => sum + (d.principalAmount || 0), 0);
    const byStatus: Record<string, number> = {};
    for (const d of this.store) {
      byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    }
    const recentDeals = [...this.store]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
    return { totalDeals: total, totalFaceValue, byStatus, recentDeals };
  }
}
