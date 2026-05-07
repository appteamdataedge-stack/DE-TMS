import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { TmsSelectComponent } from '../../shared/components/tms-select/tms-select.component';

export interface Deal {
  id: string;
  dealDate: string;
  counterparty: string;
  cpCode: string;
  direction: 'ACCEPT' | 'PLACE';
  instrument: string;
  currency: string;
  amount: number;
  rate: number;
  valueDate: string;
  maturityDate: string;
  days: number;
  status: 'ACTIVE' | 'PENDING' | 'MATURED' | 'CANCELLED';
}

@Component({
  selector: 'app-blotter',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TmsSelectComponent],
  animations: [
    trigger('slideOver', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('backdropFade', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease', style({ opacity: 0 }))])
    ])
  ],
  templateUrl: './blotter.component.html',
  styleUrl:    './blotter.component.scss'
})
export class BlotterComponent {

  private router = inject(Router);

  filterOpen   = false;
  selectedDeal: Deal | null = null;

  contextMenu  = { show: false, x: 0, y: 0, deal: null as Deal | null };
  approveModal = { show: false, deal: null as Deal | null };

  currentPage = 1;
  pageSize    = 20;
  readonly pageSizeOptions = [10, 20, 50];

  quickFilter: 'ALL' | 'TODAY' = 'ALL';

  @HostListener('document:click')
  onDocumentClick(): void { this.contextMenu.show = false; }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.contextMenu.show = false;
    this.approveModal = { show: false, deal: null };
  }

  showContextMenu(event: MouseEvent, deal: Deal): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu = { show: true, x: event.clientX, y: event.clientY, deal };
  }

  // ── Context Menu Actions ─────────────────────────────────────────────────
  ctxViewDetail(): void {
    if (!this.contextMenu.deal) return;
    this.contextMenu.show = false;
    this.router.navigate(['/mm-deal', this.contextMenu.deal.id, 'summary']);
  }

  ctxModifyDeal(): void {
    if (!this.contextMenu.deal) return;
    this.contextMenu.show = false;
    this.router.navigate(['/mm-deal', this.contextMenu.deal.id]);
  }

  ctxVerifyApprove(): void {
    if (!this.contextMenu.deal) return;
    this.approveModal = { show: true, deal: this.contextMenu.deal };
    this.contextMenu.show = false;
  }

  ctxResendMT320(): void { this.contextMenu.show = false; }
  ctxExportRow(): void   { this.contextMenu.show = false; }

  // ── Approval Modal ───────────────────────────────────────────────────────
  confirmApprove(): void { this.approveModal = { show: false, deal: null }; }
  cancelApprove(): void  { this.approveModal = { show: false, deal: null }; }

  // ── Preview Panel ────────────────────────────────────────────────────────
  selectDeal(d: Deal): void { this.filterOpen = false; this.selectedDeal = d; }
  closeDeal(): void          { this.selectedDeal = null; }

  // ── Row Actions (FIX 5) ──────────────────────────────────────────────────
  onEditDeal(deal: Deal): void {
    // TODO: wire to PUT API when edit flow is built
    this.router.navigate(['/mm-deal', deal.id]);
  }

  onDeleteDeal(deal: Deal): void {
    if (!confirm(`Delete deal ${deal.id}? This cannot be undone.`)) return;
    // TODO: call DELETE /api/mm-deals/:id
    alert('Feature coming soon');
  }

  // ── Quick Filter & Page Size ─────────────────────────────────────────────
  setQuickFilter(f: 'ALL' | 'TODAY'): void { this.quickFilter = f; this.currentPage = 1; }
  setPageSize(n: number | string): void    { this.pageSize = +n; this.currentPage = 1; }

  // ── Filters ──────────────────────────────────────────────────────────────
  filters = {
    direction:      'ALL' as 'ALL' | 'ACCEPT' | 'PLACE',
    counterparties: [] as string[],
    currencies:     [] as string[],
    statuses:       [] as string[],
  };

  sortCol: keyof Deal = 'dealDate';
  sortDir: 'asc' | 'desc' = 'desc';

  readonly allDeals: Deal[] = [
    { id: 'MM-2026-00001', dealDate: '2026-04-20', counterparty: 'City Bank Ltd',         cpCode: 'CTYB', direction: 'PLACE',  instrument: 'Fixed Term Deposit', currency: 'BDT', amount: 10_000_000, rate: 5.80, valueDate: '2026-04-20', maturityDate: '2026-10-22', days: 183, status: 'ACTIVE'    },
    { id: 'MM-2026-00002', dealDate: '2026-04-23', counterparty: 'BRAC Bank',              cpCode: 'BRAC', direction: 'PLACE',  instrument: 'Fixed Term Deposit', currency: 'USD', amount:  5_000_000, rate: 5.20, valueDate: '2026-04-23', maturityDate: '2026-07-22', days: 91,  status: 'ACTIVE'    },
    { id: 'MM-2026-00003', dealDate: '2026-04-22', counterparty: 'Sonali Bank',            cpCode: 'SONL', direction: 'ACCEPT', instrument: 'Fixed Term Deposit', currency: 'BDT', amount: 15_000_000, rate: 6.50, valueDate: '2026-04-25', maturityDate: '2027-01-23', days: 275, status: 'ACTIVE'    },
    { id: 'MM-2026-00004', dealDate: '2026-04-01', counterparty: 'Janata Bank',            cpCode: 'JNTB', direction: 'ACCEPT', instrument: 'Call Deposit',       currency: 'BDT', amount: 13_000_000, rate: 6.00, valueDate: '2026-04-01', maturityDate: '2026-10-23', days: 184, status: 'ACTIVE'    },
    { id: 'MM-2026-00005', dealDate: '2026-04-21', counterparty: 'Standard Chartered BD',  cpCode: 'SCBL', direction: 'ACCEPT', instrument: 'Overnight Deposit',  currency: 'USD', amount:  2_000_000, rate: 4.80, valueDate: '2026-04-21', maturityDate: '2026-07-19', days: 88,  status: 'ACTIVE'    },
    { id: 'MM-2026-00006', dealDate: '2026-04-10', counterparty: 'Dutch-Bangla Bank',      cpCode: 'DBBL', direction: 'PLACE',  instrument: 'Repo Agreement',     currency: 'BDT', amount:  8_000_000, rate: 5.50, valueDate: '2026-04-10', maturityDate: '2026-07-10', days: 78,  status: 'PENDING'   },
    { id: 'MM-2026-00007', dealDate: '2026-03-01', counterparty: 'Islami Bank Bangladesh', cpCode: 'IBBL', direction: 'ACCEPT', instrument: 'Fixed Term Deposit', currency: 'BDT', amount: 20_000_000, rate: 6.75, valueDate: '2026-03-01', maturityDate: '2026-03-31', days: 0,   status: 'MATURED'   },
    { id: 'MM-2026-00008', dealDate: '2026-01-15', counterparty: 'HSBC Bangladesh',        cpCode: 'HSBC', direction: 'PLACE',  instrument: 'Treasury Bill',      currency: 'USD', amount:  3_000_000, rate: 4.50, valueDate: '2026-01-15', maturityDate: '2026-04-15', days: 0,   status: 'MATURED'   },
    { id: 'MM-2026-00009', dealDate: '2026-04-22', counterparty: 'BRAC Bank',              cpCode: 'BRAC', direction: 'PLACE',  instrument: 'Fixed Term Deposit', currency: 'BDT', amount: 12_000_000, rate: 6.20, valueDate: '2026-04-22', maturityDate: '2026-10-22', days: 183, status: 'PENDING'   },
    { id: 'MM-2026-00010', dealDate: '2026-04-23', counterparty: 'City Bank Ltd',          cpCode: 'CTYB', direction: 'ACCEPT', instrument: 'Overnight Deposit',  currency: 'USD', amount:  1_500_000, rate: 5.00, valueDate: '2026-04-23', maturityDate: '2026-04-24', days: 1,   status: 'ACTIVE'    },
    { id: 'MM-2026-00011', dealDate: '2026-02-10', counterparty: 'Al-Arafah Islami Bank',  cpCode: 'AIBL', direction: 'PLACE',  instrument: 'Fixed Term Deposit', currency: 'BDT', amount:  7_500_000, rate: 6.10, valueDate: '2026-02-10', maturityDate: '2026-08-10', days: 109, status: 'ACTIVE'    },
    { id: 'MM-2026-00012', dealDate: '2026-03-15', counterparty: 'Sonali Bank',            cpCode: 'SONL', direction: 'PLACE',  instrument: 'Repo Agreement',     currency: 'BDT', amount:  9_000_000, rate: 5.75, valueDate: '2026-03-15', maturityDate: '2026-03-22', days: 0,   status: 'CANCELLED' },
    { id: 'MM-2026-00013', dealDate: '2026-04-30', counterparty: 'City Bank Ltd',          cpCode: 'CTYB', direction: 'PLACE',  instrument: 'Fixed Term Deposit', currency: 'BDT', amount:  5_000_000, rate: 6.00, valueDate: '2026-04-30', maturityDate: '2026-10-30', days: 183, status: 'PENDING'   },
    { id: 'MM-2026-00014', dealDate: '2026-04-30', counterparty: 'BRAC Bank',              cpCode: 'BRAC', direction: 'ACCEPT', instrument: 'Overnight Deposit',  currency: 'USD', amount:  2_500_000, rate: 4.90, valueDate: '2026-04-30', maturityDate: '2026-05-01', days: 1,   status: 'PENDING'   },
  ];

  readonly statusOptions = ['ACTIVE', 'PENDING', 'MATURED', 'CANCELLED'];

  get uniqueCounterparties(): string[] {
    return [...new Set(this.allDeals.map(d => d.counterparty))].sort();
  }

  get uniqueCurrencies(): string[] {
    return [...new Set(this.allDeals.map(d => d.currency))].sort();
  }

  get todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get filteredDeals(): Deal[] {
    let list = [...this.allDeals];

    if (this.quickFilter === 'TODAY')           list = list.filter(d => d.valueDate === this.todayIso);
    if (this.filters.direction !== 'ALL')       list = list.filter(d => d.direction === this.filters.direction);
    if (this.filters.counterparties.length)     list = list.filter(d => this.filters.counterparties.includes(d.counterparty));
    if (this.filters.currencies.length)         list = list.filter(d => this.filters.currencies.includes(d.currency));
    if (this.filters.statuses.length)           list = list.filter(d => this.filters.statuses.includes(d.status));

    list.sort((a, b) => {
      const av = String(a[this.sortCol]);
      const bv = String(b[this.sortCol]);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }

  get pagedDeals(): Deal[] {
    const top = this.totalPages;
    if (this.currentPage > top) this.currentPage = top;
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDeals.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDeals.length / this.pageSize));
  }

  get visiblePages(): (number | '...')[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cur > 3)          pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2)  pages.push('...');
    pages.push(total);
    return pages;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  get filteredTotals(): { currency: string; amount: number }[] {
    const map = new Map<string, number>();
    for (const d of this.filteredDeals) {
      map.set(d.currency, (map.get(d.currency) ?? 0) + d.amount);
    }
    return [...map.entries()]
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }

  get activeFilterCount(): number {
    let n = this.filters.direction !== 'ALL' ? 1 : 0;
    return n + this.filters.counterparties.length + this.filters.currencies.length + this.filters.statuses.length;
  }

  get activeChips(): { label: string; key: string; value: string }[] {
    const chips: { label: string; key: string; value: string }[] = [];
    if (this.filters.direction !== 'ALL')
      chips.push({ label: this.filters.direction, key: 'direction', value: this.filters.direction });
    this.filters.counterparties.forEach(c => chips.push({ label: c, key: 'counterparty', value: c }));
    this.filters.currencies.forEach(c    => chips.push({ label: c, key: 'currency',     value: c }));
    this.filters.statuses.forEach(s      => chips.push({ label: s, key: 'status',        value: s }));
    return chips;
  }

  clearFilters(): void {
    this.filters     = { direction: 'ALL', counterparties: [], currencies: [], statuses: [] };
    this.quickFilter = 'ALL';
    this.currentPage = 1;
  }

  removeChip(chip: { key: string; value: string }): void {
    switch (chip.key) {
      case 'direction':    this.filters.direction      = 'ALL'; break;
      case 'counterparty': this.filters.counterparties = this.filters.counterparties.filter(x => x !== chip.value); break;
      case 'currency':     this.filters.currencies     = this.filters.currencies.filter(x => x !== chip.value); break;
      case 'status':       this.filters.statuses       = this.filters.statuses.filter(x => x !== chip.value); break;
    }
    this.currentPage = 1;
  }

  toggleSort(col: keyof Deal): void {
    this.sortDir = this.sortCol === col && this.sortDir === 'desc' ? 'asc' : 'desc';
    this.sortCol = col;
  }

  fmtAmount(n: number): string {
    return new Intl.NumberFormat('en-US').format(n);
  }

  fmtDate(iso: string): string {
    return iso ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—';
  }

  statusBadge(s: string): string {
    return ({ ACTIVE: 'teal', PENDING: 'amber', MATURED: 'neutral', CANCELLED: 'red' } as Record<string, string>)[s] ?? 'neutral';
  }

  daysBadge(d: number): string {
    if (d <= 7)  return 'red';
    if (d <= 90) return 'amber';
    return 'neutral';
  }
}
