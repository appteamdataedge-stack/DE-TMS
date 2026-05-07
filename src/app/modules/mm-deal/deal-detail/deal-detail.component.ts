import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuditService, AuditLog } from '../../../core/services/audit.service';

type Tab = 'summary' | 'cashflow' | 'accounting' | 'audit';

@Component({
  selector: 'app-deal-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deal-detail.component.html',
  styleUrl: './deal-detail.component.scss'
})
export class DealDetailComponent {

  private auditService = inject(AuditService);

  activeTab: Tab = 'summary';
  setTab(t: Tab): void { this.activeTab = t; }

  readonly deal = {
    id:              'MM-2026-00001',
    counterparty:    'City Bank Ltd',
    direction:       'PLACE' as const,
    instrument:      'Fixed Term Deposit',
    instrumentCode:  'FTD',
    dealType:        'TERM' as 'TERM' | 'CALL',
    currency:        'BDT',
    faceValue:       10_000_000,
    rate:            7.25,
    valueDate:       '22 Apr 2026',
    maturityDate:    '22 Oct 2026',
    tenor:           183,
    dayCount:        'ACT / 365',
    portfolio:       'MM-PORTFOLIO-001',
    settlementGl:    '1001-Settlement',
    liabilityGl:     '2001-MM-Liability',
    status:          'AUTHORIZED' as 'AUTHORIZED' | 'SUBMITTED' | 'REJECTED' | 'CANCELLED' | 'MATURED',
    maker:           'MD Rahman',
    authorisedBy:    'KM Hossain',
    interest:        26_301.37,
    maturityAmount:  10_026_301.37,
    dealDate:        '20 Apr 2026',
    authorisedDate:  '21 Apr 2026',
  };

  readonly cashflows = [
    { seq: 1, date: '22 Oct 2026', type: 'RECEIVE', event: 'Principal + Interest', amount: 10_026_301.37, status: 'PENDING' },
  ];

  readonly bookingEntries: { date: string; description: string; gl: string; dr: number | null; cr: number | null }[] = [
    { date: '22 Apr 2026', description: 'Dr Settlement Account', gl: '1001-Settlement', dr: 10_000_000, cr: null  },
    { date: '22 Apr 2026', description: 'Cr MM Liability GL',    gl: '2001-MM-Liability', dr: null,  cr: 10_000_000 },
  ];

  get auditEvents(): AuditLog[] {
    return this.auditService.getByRefId(this.deal.id);
  }

  readonly actionLabelMap: Record<string, string> = {
    CREATE: 'CREATE', DRAFT: 'DRAFT', SUBMIT: 'SUBMIT', AUTHORIZE: 'AUTHORIZE',
    REJECT: 'REJECT', CANCEL: 'CANCEL', UPDATE: 'UPDATE',
    EARLY_TERMINATE: 'TERMINATE', RECALL: 'RECALL',
  };

  readonly actionBadgeMap: Record<string, string> = {
    CREATE: 'teal', DRAFT: 'neutral', SUBMIT: 'amber', AUTHORIZE: 'green',
    REJECT: 'red', CANCEL: 'neutral', UPDATE: 'navy', EARLY_TERMINATE: 'amber', RECALL: 'amber',
  };

  readonly dotColorMap: Record<string, string> = {
    CREATE: '#0FA383', DRAFT: '#9CA3AF', SUBMIT: '#F5A623', AUTHORIZE: '#16A34A',
    REJECT: '#DC2626', CANCEL: '#9CA3AF', UPDATE: '#0D1B2A',
    EARLY_TERMINATE: '#F5A623', RECALL: '#F5A623',
  };

  actionLabel(a: string): string { return this.actionLabelMap[a] ?? a; }
  actionBadge(a: string): string { return this.actionBadgeMap[a] ?? 'neutral'; }
  dotColor(a: string): string    { return this.dotColorMap[a]    ?? '#9CA3AF'; }

  fmtTs(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  fmtAmount(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
