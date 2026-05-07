import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DealFormService, Portfolio } from '../../mm-deal/deal-form.service';

@Component({
  selector: 'app-portfolio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './portfolio-list.component.html',
  styleUrl: './portfolio-list.component.scss'
})
export class PortfolioListComponent {
  searchTerm = '';
  statusFilter = 'ALL';

  statusOptions = [
    { value: 'ALL',      label: 'All Statuses' },
    { value: 'ACTIVE',   label: 'Active'        },
    { value: 'INACTIVE', label: 'Inactive'      },
  ];

  bookTypeOptions = [
    { value: 'ALL',     label: 'All Types' },
    { value: 'BANKING', label: 'Banking'   },
    { value: 'TRADING', label: 'Trading'   },
    { value: 'ALM',     label: 'ALM'       },
  ];
  bookTypeFilter = 'ALL';

  constructor(public svc: DealFormService) {}

  get allPortfolios(): Portfolio[] { return this.svc.portfolios; }

  get filtered(): Portfolio[] {
    const term = this.searchTerm.toLowerCase();
    return this.allPortfolios.filter(p => {
      const matchSearch = !term ||
        p.id.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.bookType.toLowerCase().includes(term);
      const matchStatus = this.statusFilter === 'ALL' || p.status === this.statusFilter;
      const matchType   = this.bookTypeFilter === 'ALL' || p.bookType === this.bookTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }

  get kpis() {
    const total    = this.allPortfolios.length;
    const active   = this.allPortfolios.filter(p => p.status === 'ACTIVE').length;
    const inactive = total - active;
    return { total, active, inactive };
  }

  statusBadge(status: string): string {
    return status === 'ACTIVE' ? 'green' : 'neutral';
  }

  bookTypeBadge(bookType: string): string {
    const map: Record<string, string> = { BANKING: 'navy', TRADING: 'teal', ALM: 'amber' };
    return map[bookType] ?? 'neutral';
  }
}
