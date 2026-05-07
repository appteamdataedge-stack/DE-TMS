import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type ProdCategory = 'MM' | 'CM' | 'FX';

interface Product {
  id: string;
  name: string;
  instrument: string;
  category: ProdCategory;
  pricingType: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl:    './product-list.component.scss'
})
export class ProductListComponent {

  readonly categoryLabel: Record<ProdCategory, string> = {
    MM: 'Money Market',
    CM: 'Capital Market',
    FX: 'FX',
  };

  readonly categoryBadge: Record<ProdCategory, string> = {
    MM: 'de-badge--teal',
    CM: 'de-badge--purple',
    FX: 'de-badge--amber',
  };

  products: Product[] = [
    { id: 'PROD-2026-001', name: 'FTD Standard',           instrument: 'Fixed Term Deposit',        category: 'MM', pricingType: 'Normal',      effectiveDate: '01 Jan 2026', status: 'ACTIVE'   },
    { id: 'PROD-2026-002', name: 'Call Deposit — General', instrument: 'Call Deposit',               category: 'MM', pricingType: 'Normal',      effectiveDate: '01 Jan 2026', status: 'ACTIVE'   },
    { id: 'PROD-2026-003', name: 'Overnight Deposit',      instrument: 'Overnight Deposit',          category: 'MM', pricingType: 'Normal',      effectiveDate: '15 Jan 2026', status: 'ACTIVE'   },
    { id: 'PROD-2026-004', name: 'Repo Standard',          instrument: 'Repo Agreement',             category: 'MM', pricingType: 'Discounting', effectiveDate: '01 Feb 2026', status: 'INACTIVE' },
  ];

  get activeCount() { return this.products.filter(p => p.status === 'ACTIVE').length; }

  onViewProduct(prod: Product): void {
    // TODO: navigate to product detail page
    alert('Feature coming soon');
  }

  onEditProduct(prod: Product): void {
    // TODO: navigate to product edit form
    alert('Feature coming soon');
  }

  onDeleteProduct(prod: Product): void {
    if (!confirm(`Delete product ${prod.id} – ${prod.name}? This cannot be undone.`)) return;
    // TODO: call DELETE /api/products/:id
    alert('Feature coming soon');
  }
}
