import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DealFormService, Instrument } from '../../mm-deal/deal-form.service';

@Component({
  selector: 'app-instrument-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './instrument-list.component.html',
  styleUrl: './instrument-list.component.scss'
})
export class InstrumentListComponent {
  searchTerm      = '';
  categoryFilter  = 'ALL';

  readonly categoryOptions = [
    { value: 'ALL',      label: 'All Categories' },
    { value: 'Deposit',  label: 'Deposit'         },
    { value: 'Lending',  label: 'Lending'         },
    { value: 'Security', label: 'Security'        },
  ];

  constructor(public svc: DealFormService) {}

  get allInstruments(): Instrument[] { return this.svc.instruments; }

  get filtered(): Instrument[] {
    const term = this.searchTerm.toLowerCase();
    return this.allInstruments.filter(i => {
      const matchSearch   = !term || i.id.toLowerCase().includes(term) || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term);
      const matchCategory = this.categoryFilter === 'ALL' || i.category === this.categoryFilter;
      return matchSearch && matchCategory;
    });
  }

  get kpis() {
    return {
      total:    this.allInstruments.length,
      deposit:  this.allInstruments.filter(i => i.category === 'Deposit').length,
      lending:  this.allInstruments.filter(i => i.category === 'Lending').length,
      security: this.allInstruments.filter(i => i.category === 'Security').length,
    };
  }

  pricingBadge(p: string): string { return p === 'DISCOUNTING' ? 'amber' : 'navy'; }
  categoryBadge(c: string): string {
    const m: Record<string, string> = { Deposit: 'teal', Lending: 'navy', Security: 'amber' };
    return m[c] ?? 'neutral';
  }
}
