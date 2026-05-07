import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type GlType = 'PRODUCT' | 'SETTLEMENT' | 'INCOME' | 'EXPENSE' | 'LIABILITY';

interface GlAccount {
  id: string;
  name: string;
  type: GlType;
  externalGl: string;
  status: 'ACTIVE' | 'INACTIVE';
  productName?: string;
}

@Component({
  selector: 'app-gl-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gl-list.component.html',
  styleUrl: './gl-list.component.scss'
})
export class GlListComponent {

  readonly typeLabel: Record<GlType, string> = {
    PRODUCT:    'Product GL',
    SETTLEMENT: 'Settlement GL',
    INCOME:     'Income GL',
    EXPENSE:    'Expense GL',
    LIABILITY:  'Liability GL',
  };

  readonly typeBadge: Record<GlType, string> = {
    PRODUCT:    'de-badge--teal',
    SETTLEMENT: 'de-badge--navy',
    INCOME:     'de-badge--green',
    EXPENSE:    'de-badge--amber',
    LIABILITY:  'de-badge--purple',
  };

  glAccounts: GlAccount[] = [
    { id: 'GL-2026-0001', name: 'MM Settlement Account',     type: 'SETTLEMENT', externalGl: '100200300400500', status: 'ACTIVE'   },
    { id: 'GL-2026-0002', name: 'Interest Income — FTD',     type: 'INCOME',     externalGl: '200100400300500', status: 'ACTIVE'   },
    { id: 'GL-2026-0003', name: 'Term Deposits Liability',   type: 'LIABILITY',  externalGl: '300500100200400', status: 'ACTIVE'   },
    { id: 'GL-2026-0004', name: 'FTD Standard — Product GL', type: 'PRODUCT',    externalGl: '400100200300500', status: 'ACTIVE',   productName: 'FTD Standard' },
    { id: 'GL-2026-0005', name: 'Bank Charges — MM',         type: 'EXPENSE',    externalGl: '500400300100200', status: 'INACTIVE' },
  ];

  get activeCount()    { return this.glAccounts.filter(g => g.status === 'ACTIVE').length; }
  get productGlCount() { return this.glAccounts.filter(g => g.type   === 'PRODUCT').length; }
}
