import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

export type TabId = 'overview' | 'schedule' | 'accounting' | 'lifecycle';

interface Deal {
  id: string; counterparty: string; counterpartyId: string;
  direction: 'PLACE' | 'TAKE'; instrument: string; instrumentCode: string;
  dealType: string; currency: string; faceValue: number; rate: number;
  rateType: string; dayCount: string; tenor: number;
  valueDate: string; valueDateIso: string;
  maturityDate: string; maturityDateIso: string;
  dealDate: string; authorisedDate: string;
  portfolio: string; settlementGl: string; liabilityGl: string;
  status: 'AUTHORIZED' | 'SUBMITTED' | 'REJECTED' | 'CANCELLED' | 'MATURED';
  maker: string; authorisedBy: string; interest: number; maturityAmount: number;
}

const DEALS_MAP: Record<string, Deal> = {
  'MM-2026-00001': {
    id: 'MM-2026-00001', counterparty: 'City Bank Ltd', counterpartyId: 'BP002',
    direction: 'PLACE', instrument: 'Fixed Term Deposit', instrumentCode: 'FTD',
    dealType: 'TERM', currency: 'BDT', faceValue: 10_000_000, rate: 7.25,
    rateType: 'Fixed', dayCount: 'ACT/365', tenor: 183,
    valueDate: '22 Apr 2026', valueDateIso: '2026-04-22',
    maturityDate: '22 Oct 2026', maturityDateIso: '2026-10-22',
    dealDate: '20 Apr 2026', authorisedDate: '21 Apr 2026',
    portfolio: 'MM-PORTFOLIO-001', settlementGl: '1001-Settlement', liabilityGl: '2001-MM-Liability',
    status: 'AUTHORIZED', maker: 'MD Rahman', authorisedBy: 'KM Hossain',
    interest: 36_301.37, maturityAmount: 10_036_301.37,
  },
  'MM-2026-00002': {
    id: 'MM-2026-00002', counterparty: 'Dutch Bangla Bank', counterpartyId: 'BP005',
    direction: 'TAKE', instrument: 'Call Deposit', instrumentCode: 'CALL',
    dealType: 'CALL', currency: 'BDT', faceValue: 25_000_000, rate: 6.75,
    rateType: 'Fixed', dayCount: 'ACT/365', tenor: 90,
    valueDate: '15 Mar 2026', valueDateIso: '2026-03-15',
    maturityDate: '13 Jun 2026', maturityDateIso: '2026-06-13',
    dealDate: '13 Mar 2026', authorisedDate: '14 Mar 2026',
    portfolio: 'MM-PORTFOLIO-002', settlementGl: '1002-Settlement', liabilityGl: '2002-MM-Liability',
    status: 'AUTHORIZED', maker: 'S Ahmed', authorisedBy: 'KM Hossain',
    interest: 41_780.82, maturityAmount: 25_041_780.82,
  },
  'MM-2026-00003': {
    id: 'MM-2026-00003', counterparty: 'BRAC Bank Ltd', counterpartyId: 'BP008',
    direction: 'PLACE', instrument: 'Treasury Bill', instrumentCode: 'TBILL',
    dealType: 'DISCOUNT', currency: 'BDT', faceValue: 50_000_000, rate: 8.10,
    rateType: 'Discount', dayCount: 'ACT/365', tenor: 364,
    valueDate: '01 Jan 2026', valueDateIso: '2026-01-01',
    maturityDate: '31 Dec 2026', maturityDateIso: '2026-12-31',
    dealDate: '29 Dec 2025', authorisedDate: '30 Dec 2025',
    portfolio: 'MM-PORTFOLIO-001', settlementGl: '1001-Settlement', liabilityGl: '2003-TBILL-Liability',
    status: 'AUTHORIZED', maker: 'N Chowdhury', authorisedBy: 'KM Hossain',
    interest: 404_383.56, maturityAmount: 50_404_383.56,
  },
};

@Component({
  selector: 'app-deal-summary',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deal-summary.component.html',
  styleUrl: './deal-summary.component.scss'
})
export class DealSummaryComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  readonly dealId = this.route.snapshot.paramMap.get('id') ?? 'MM-2026-00001';
  readonly deal   = DEALS_MAP[this.dealId] ?? DEALS_MAP['MM-2026-00001'];

  activeTab: TabId = 'overview';

  readonly tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
    { id: 'schedule',   label: 'Schedule',    icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    { id: 'accounting', label: 'Accounting',  icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { id: 'lifecycle',  label: 'Lifecycle',   icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  ];

  readonly cashflows = [
    { seq: 1, date: this.deal.maturityDate, type: 'RECEIVE', event: 'Principal + Interest', amount: this.deal.maturityAmount, status: 'PENDING' },
  ];

  readonly bookingEntries: { date: string; description: string; gl: string; dr: number | null; cr: number | null }[] = [
    { date: this.deal.valueDate, description: 'Dr Settlement Account', gl: this.deal.settlementGl, dr: this.deal.faceValue, cr: null },
    { date: this.deal.valueDate, description: 'Cr MM Liability GL',    gl: this.deal.liabilityGl,  dr: null, cr: this.deal.faceValue },
  ];

  readonly lifecycleEvents = [
    { date: this.deal.dealDate,       label: 'Deal Created',  user: this.deal.maker,        done: true  },
    { date: this.deal.dealDate,       label: 'Submitted',     user: this.deal.maker,        done: true  },
    { date: this.deal.authorisedDate, label: 'Authorized',    user: this.deal.authorisedBy, done: true  },
    { date: this.deal.valueDate,      label: 'Settled',       user: 'System',               done: true  },
    { date: this.deal.maturityDate,   label: 'Maturity',      user: '—',                    done: false },
  ];

  readonly statusBadgeMap: Record<string, string> = {
    AUTHORIZED: 'green', SUBMITTED: 'amber', REJECTED: 'red',
    CANCELLED: 'neutral', MATURED: 'neutral',
  };

  get statusBadge(): string { return this.statusBadgeMap[this.deal.status] ?? 'neutral'; }

  get progressPct(): number {
    const today   = new Date();
    const start   = new Date(this.deal.valueDateIso);
    const end     = new Date(this.deal.maturityDateIso);
    const elapsed = Math.max(0, today.getTime() - start.getTime());
    const total   = end.getTime() - start.getTime();
    return total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  }

  formatAmount(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  setTab(id: TabId): void { this.activeTab = id; }

  goBack(): void { this.router.navigate(['/blotter']); }

  printPage(): void { window.print(); }
}
