import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface SsiEntry {
  id: string;
  currency: string;
  counterparty: string;
  beneficiaryBank: string;
  beneficiarySwift: string;
  settlementType: string;
  corrBank: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-ssi-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ssi-list.component.html',
  styleUrl:    './ssi-list.component.scss'
})
export class SsiListComponent {

  ssiList: SsiEntry[] = [
    { id: 'SSI-2026-001', currency: 'BDT', counterparty: 'City Bank Ltd',           beneficiaryBank: 'City Bank Ltd',          beneficiarySwift: 'CIBLBDDH',    settlementType: 'RTGS',          corrBank: 'Sonali Bank PLC',      status: 'ACTIVE'   },
    { id: 'SSI-2026-002', currency: 'USD', counterparty: 'HSBC Bangladesh',          beneficiaryBank: 'HSBC Bangladesh',         beneficiarySwift: 'HSBCBDDH',    settlementType: 'Wire Transfer', corrBank: 'Standard Chartered BD', status: 'ACTIVE'   },
    { id: 'SSI-2026-003', currency: 'EUR', counterparty: 'BRAC Bank Limited',        beneficiaryBank: 'BRAC Bank Limited',       beneficiarySwift: 'BRACBDDH',    settlementType: 'Wire Transfer', corrBank: '—',                    status: 'INACTIVE' },
    { id: 'SSI-2026-004', currency: 'BDT', counterparty: 'Janata Bank Ltd',          beneficiaryBank: 'Janata Bank Ltd',         beneficiarySwift: 'JANBBDDH',    settlementType: 'RTGS',          corrBank: '—',                    status: 'ACTIVE'   },
    { id: 'SSI-2026-005', currency: 'USD', counterparty: 'Dutch-Bangla Bank Ltd',    beneficiaryBank: 'Dutch-Bangla Bank Ltd',   beneficiarySwift: 'DBBLBDDH',    settlementType: 'Wire Transfer', corrBank: 'HSBC Bangladesh',      status: 'ACTIVE'   },
  ];

  get activeCount()   { return this.ssiList.filter(s => s.status === 'ACTIVE').length; }
  get currencySet()   { return [...new Set(this.ssiList.map(s => s.currency))].length; }
}
