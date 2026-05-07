import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';

export interface Counterparty {
  bpId: string;
  name: string;
  category: 'BANK' | 'NBFI' | 'CORPORATE';
  type: string;
  country: string;
  swift: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  blacklisted: boolean;
  activeDeals: number;
  exposure: Record<string, number>;
  limit: Record<string, number>;
  contact: string;
  phone: string;
  email: string;
  onboardedDate: string;
  creditRating: string;
  sector: string;
}

@Component({
  selector: 'app-counterparty-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TmsSelectComponent],
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
  templateUrl: './counterparty-list.component.html',
  styleUrl: './counterparty-list.component.scss'
})
export class CounterpartyListComponent {

  searchTerm = '';
  statusFilter: string = 'ALL';
  categoryFilter: string = 'ALL';

  readonly statusOptions = [
    { value: 'ALL',         label: 'All Statuses' },
    { value: 'ACTIVE',      label: 'Active'       },
    { value: 'INACTIVE',    label: 'Inactive'     },
    { value: 'BLACKLISTED', label: 'Blacklisted'  },
  ];

  readonly categoryOptions = [
    { value: 'ALL',       label: 'All Categories' },
    { value: 'BANK',      label: 'Bank'           },
    { value: 'NBFI',      label: 'NBFI'           },
    { value: 'CORPORATE', label: 'Corporate'      },
  ];

  selected: Counterparty | null = null;
  openDetail(cp: Counterparty): void { this.selected = cp; }
  closeDetail(): void               { this.selected = null; }

  readonly allCounterparties: Counterparty[] = [
    {
      bpId: 'BP001', name: 'Sonali Bank PLC', category: 'BANK', type: 'State-owned',
      country: 'Bangladesh', swift: 'BSONBDDH', status: 'ACTIVE', blacklisted: false,
      activeDeals: 3, exposure: { BDT: 50_000_000 }, limit: { BDT: 200_000_000 },
      contact: 'Md. Karim', phone: '+880-2-9550426', email: 'treasury@sonalibank.com.bd',
      onboardedDate: '15 Jan 2024', creditRating: 'AA+', sector: 'Public Bank'
    },
    {
      bpId: 'BP002', name: 'City Bank Ltd', category: 'BANK', type: 'Private',
      country: 'Bangladesh', swift: 'CIBLBDDH', status: 'ACTIVE', blacklisted: false,
      activeDeals: 5, exposure: { BDT: 75_000_000, USD: 1_500_000 }, limit: { BDT: 300_000_000, USD: 10_000_000 },
      contact: 'S. Rahman', phone: '+880-2-9560099', email: 'treasury@thecitybank.com',
      onboardedDate: '01 Jun 2023', creditRating: 'A+', sector: 'Private Bank'
    },
    {
      bpId: 'BP003', name: 'BRAC Bank Limited', category: 'BANK', type: 'Private',
      country: 'Bangladesh', swift: 'BRACBDDH', status: 'ACTIVE', blacklisted: false,
      activeDeals: 2, exposure: { BDT: 30_000_000, USD: 5_000_000 }, limit: { BDT: 150_000_000, USD: 20_000_000 },
      contact: 'F. Hossain', phone: '+880-2-9884051', email: 'treasury@bracbank.com',
      onboardedDate: '10 Sep 2023', creditRating: 'A', sector: 'Private Bank'
    },
    {
      bpId: 'BP004', name: 'Dutch-Bangla Bank Ltd', category: 'BANK', type: 'Private',
      country: 'Bangladesh', swift: 'DBBLBDDH', status: 'INACTIVE', blacklisted: false,
      activeDeals: 0, exposure: { BDT: 0 }, limit: { BDT: 100_000_000 },
      contact: 'N/A', phone: '', email: '',
      onboardedDate: '15 Mar 2022', creditRating: 'A', sector: 'Private Bank'
    },
    {
      bpId: 'BP005', name: 'Islami Bank Bangladesh', category: 'BANK', type: 'Private Islamic',
      country: 'Bangladesh', swift: 'IBBLBDDH', status: 'BLACKLISTED', blacklisted: true,
      activeDeals: 0, exposure: { BDT: 20_000_000 }, limit: { BDT: 0 },
      contact: 'A. Islam', phone: '', email: '',
      onboardedDate: '01 Jul 2021', creditRating: 'BBB', sector: 'Islamic Bank'
    },
    {
      bpId: 'BP006', name: 'HSBC Bangladesh', category: 'BANK', type: 'International',
      country: 'Bangladesh', swift: 'HSBCBDDH', status: 'ACTIVE', blacklisted: false,
      activeDeals: 1, exposure: { USD: 3_000_000 }, limit: { USD: 50_000_000 },
      contact: 'M. Ahmed', phone: '+880-2-9887575', email: 'treasury.bd@hsbc.com',
      onboardedDate: '01 Apr 2024', creditRating: 'AAA', sector: 'International Bank'
    },
    {
      bpId: 'BP007', name: 'Janata Bank Ltd', category: 'BANK', type: 'State-owned',
      country: 'Bangladesh', swift: 'JANBBDDH', status: 'ACTIVE', blacklisted: false,
      activeDeals: 2, exposure: { BDT: 40_000_000 }, limit: { BDT: 250_000_000 },
      contact: 'R. Begum', phone: '+880-2-9560084', email: 'treasury@janatabank-bd.com',
      onboardedDate: '20 Feb 2023', creditRating: 'AA', sector: 'Public Bank'
    },
    {
      bpId: 'BP008', name: 'Standard Chartered BD', category: 'BANK', type: 'International',
      country: 'Bangladesh', swift: 'SCBLBDDH', status: 'ACTIVE', blacklisted: false,
      activeDeals: 1, exposure: { USD: 2_000_000 }, limit: { USD: 30_000_000 },
      contact: 'P. Roy', phone: '+880-2-8332444', email: 'bd.treasury@sc.com',
      onboardedDate: '05 Nov 2023', creditRating: 'AA+', sector: 'International Bank'
    },
  ];

  get filtered(): Counterparty[] {
    return this.allCounterparties.filter(cp => {
      if (this.statusFilter !== 'ALL' && cp.status !== this.statusFilter) return false;
      if (this.categoryFilter !== 'ALL' && cp.category !== this.categoryFilter) return false;
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase();
        if (!cp.name.toLowerCase().includes(q) && !cp.bpId.toLowerCase().includes(q) && !cp.swift.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  get kpis() {
    const all = this.allCounterparties;
    return {
      total:       all.length,
      active:      all.filter(c => c.status === 'ACTIVE').length,
      inactive:    all.filter(c => c.status === 'INACTIVE').length,
      blacklisted: all.filter(c => c.status === 'BLACKLISTED').length,
    };
  }

  statusBadge(s: string): string {
    return ({ ACTIVE: 'green', INACTIVE: 'neutral', BLACKLISTED: 'red' } as Record<string, string>)[s] ?? 'neutral';
  }

  limitPct(cp: Counterparty, ccy: string): number {
    const exp = cp.exposure[ccy] ?? 0;
    const lim = cp.limit[ccy] ?? 0;
    return lim > 0 ? Math.min(100, Math.round((exp / lim) * 100)) : 0;
  }

  limitColor(pct: number): string {
    if (pct >= 90) return '#DC2626';
    if (pct >= 70) return '#F5A623';
    return '#0FA383';
  }

  limitEntries(cp: Counterparty): { ccy: string; limit: number }[] {
    return Object.entries(cp.limit)
      .filter(([, v]) => v > 0)
      .map(([ccy, limit]) => ({ ccy, limit }));
  }

  fmtAmt(n: number, ccy: string): string {
    if (!n) return '—';
    return `${ccy} ${n.toLocaleString('en-US')}`;
  }

  exposureSummary(cp: Counterparty): string {
    return Object.entries(cp.exposure)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k} ${v.toLocaleString('en-US')}`)
      .join(' / ') || '—';
  }

  reactivate(cp: Counterparty): void { cp.status = 'ACTIVE'; }
  removeBlacklist(cp: Counterparty): void { cp.blacklisted = false; cp.status = 'ACTIVE'; }

  onEditCp(cp: Counterparty): void {
    // TODO: navigate to edit form when CP edit route is built
    alert('Feature coming soon');
  }

  onDeleteCp(cp: Counterparty): void {
    if (!confirm(`Delete counterparty ${cp.bpId} – ${cp.name}? This cannot be undone.`)) return;
    // TODO: call DELETE /api/counterparties/:id
    alert('Feature coming soon');
  }
}
