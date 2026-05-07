import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface BpRecord {
  id: string;
  name: string;
  category: string;
  type: string;
  country: string;
  status: string;
}

@Component({
  selector: 'app-bp-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bp-list.component.html',
  styleUrl: './bp-list.component.scss'
})
export class BpListComponent {
  searchTerm   = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';

  readonly statusOptions = [
    { value: 'ALL',      label: 'All Statuses' },
    { value: 'ACTIVE',   label: 'Active'        },
    { value: 'INACTIVE', label: 'Inactive'      },
  ];

  readonly categoryOptions = [
    { value: 'ALL',       label: 'All Categories' },
    { value: 'BANK',      label: 'Bank'            },
    { value: 'CORPORATE', label: 'Corporate'       },
    { value: 'INDIVIDUAL', label: 'Individual'     },
  ];

  readonly allPartners: BpRecord[] = [
    { id: 'BP-2026-001', name: 'Sonali Bank Ltd',         category: 'BANK',      type: 'State-owned', country: 'Bangladesh', status: 'ACTIVE'   },
    { id: 'BP-2026-002', name: 'BRAC Bank PLC',           category: 'BANK',      type: 'Private',     country: 'Bangladesh', status: 'ACTIVE'   },
    { id: 'BP-2026-003', name: 'Standard Chartered BD',   category: 'BANK',      type: 'Foreign',     country: 'Bangladesh', status: 'ACTIVE'   },
    { id: 'BP-2026-004', name: 'ACI Limited',             category: 'CORPORATE', type: 'Corporate',   country: 'Bangladesh', status: 'ACTIVE'   },
    { id: 'BP-2026-005', name: 'Square Pharmaceuticals',  category: 'CORPORATE', type: 'Corporate',   country: 'Bangladesh', status: 'INACTIVE' },
  ];

  get filtered(): BpRecord[] {
    const term = this.searchTerm.toLowerCase();
    return this.allPartners.filter(p => {
      const matchSearch = !term ||
        p.id.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.country.toLowerCase().includes(term);
      const matchStatus   = this.statusFilter   === 'ALL' || p.status   === this.statusFilter;
      const matchCategory = this.categoryFilter === 'ALL' || p.category === this.categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }

  get kpis() {
    const total    = this.allPartners.length;
    const active   = this.allPartners.filter(p => p.status === 'ACTIVE').length;
    const inactive = total - active;
    return { total, active, inactive };
  }

  statusBadge(s: string): string { return s === 'ACTIVE' ? 'green' : 'neutral'; }
  categoryBadge(c: string): string {
    const m: Record<string, string> = { BANK: 'navy', CORPORATE: 'teal', INDIVIDUAL: 'amber' };
    return m[c] ?? 'neutral';
  }
}
