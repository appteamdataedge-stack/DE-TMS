import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SqliteService, DealStats, StoredDeal } from './sqlite.service';

export interface MmDealPayload {
  dealId: string;
  productId: string;
  instrumentId: string;
  portfolioId: string;
  dealDate: string;
  dealTime: string;
  dealerId: string;
  counterpartyId: string;
  valueDate: string;
  maturityDate: string;
  dealType: string;
  depositType: string;
  pricingType: string;
  currency: string;
  principalAmount: number;
  maturityAmount: number;
  interestBasis: string;
  interestRate: number | null;
  spread: number | null;
  benchmarkId: string | null;
  dayCount: string;
  compoundingFlag: boolean;
  compoundFreq: string | null;
  fixingFreq: string | null;
  settlementFreq: string;
}

@Injectable({ providedIn: 'root' })
export class MmDealApiService {
  constructor(private sqliteService: SqliteService) {}

  submitDeal(payload: MmDealPayload): Observable<{ dealId: string }> {
    return of(this.sqliteService.insertDeal(payload));
  }

  getPendingDeals(): Observable<any[]> {
    return of(this.sqliteService.getPendingDeals());
  }

  getAllDeals(): Observable<StoredDeal[]> {
    return of(this.sqliteService.getAllDeals());
  }

  getDealStats(): Observable<DealStats> {
    return of(this.sqliteService.getDealStats());
  }
}
