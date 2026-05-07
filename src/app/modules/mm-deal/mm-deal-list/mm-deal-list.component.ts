import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MmDealApiService } from '../mm-deal-api.service';
import { StoredDeal } from '../sqlite.service';
import { DealFormService } from '../deal-form.service';

@Component({
  selector: 'app-mm-deal-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mm-deal-list.component.html',
  styleUrl: './mm-deal-list.component.scss'
})
export class MmDealListComponent implements OnInit {
  allDeals: StoredDeal[] = [];
  searchTerm = '';
  statusFilter = 'ALL';

  statusOptions = [
    { value: 'ALL',       label: 'All Statuses' },
    { value: 'SAVED',     label: 'Saved'         },
    { value: 'PENDING',   label: 'Pending'       },
    { value: 'APPROVED',  label: 'Approved'      },
    { value: 'REJECTED',  label: 'Rejected'      },
    { value: 'CANCELLED', label: 'Cancelled'     },
  ];

  constructor(
    private api: MmDealApiService,
    public  svc: DealFormService
  ) {}

  ngOnInit(): void {
    this.api.getAllDeals().subscribe(deals => this.allDeals = deals);
  }

  get filtered(): StoredDeal[] {
    const term = this.searchTerm.toLowerCase();
    return this.allDeals.filter(d => {
      const matchSearch = !term ||
        d.dealId.toLowerCase().includes(term) ||
        d.counterpartyId.toLowerCase().includes(term) ||
        d.instrumentId.toLowerCase().includes(term);
      const matchStatus = this.statusFilter === 'ALL' || d.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get kpis() {
    const total   = this.allDeals.length;
    const saved   = this.allDeals.filter(d => d.status === 'SAVED').length;
    const pending = this.allDeals.filter(d => d.status === 'PENDING').length;
    const totalFv = this.allDeals.reduce((s, d) => s + (d.principalAmount || 0), 0);
    return { total, saved, pending, totalFv };
  }

  counterpartyName(id: string): string {
    return this.svc.counterparties.find(c => c.id === id)?.name ?? id;
  }

  instrumentName(id: string): string {
    return this.svc.instruments.find(i => i.id === id)?.name ?? id;
  }

  fmtAmount(n: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      SAVED: 'neutral', PENDING: 'amber', APPROVED: 'green',
      REJECTED: 'red',  CANCELLED: 'red'
    };
    return map[status] ?? 'neutral';
  }
}
