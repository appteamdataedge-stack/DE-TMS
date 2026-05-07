import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface Dealer       { id: string; name: string; role: string; }
export interface Counterparty { id: string; name: string; type: 'State-owned' | 'Private' | 'Foreign' | 'Islamic'; }
export interface Portfolio    { id: string; name: string; bookType: string; status: string; }
export interface Currency     { code: string; name: string; flag: string; }

export interface Instrument {
  id: string;
  name: string;
  category: string;
  cashflow: string;
  compounding: boolean;
  pricing: 'SIMPLE' | 'DISCOUNTING';
  isDiscount: boolean;
}

@Injectable({ providedIn: 'root' })
export class DealFormService {

  // ─── Reference data ───────────────────────────────────────────────────

  readonly dealers: Dealer[] = [
    { id: 'USR001', name: 'Ahmed Rahman',  role: 'Senior Dealer' },
    { id: 'USR002', name: 'Farida Islam',  role: 'Dealer'        },
    { id: 'USR003', name: 'Karim Hossain', role: 'Junior Dealer' },
    { id: 'USR004', name: 'Nasrin Akter',  role: 'Dealer'        },
  ];

  readonly counterparties: Counterparty[] = [
    { id: 'BP001', name: 'Sonali Bank',            type: 'State-owned' },
    { id: 'BP002', name: 'Janata Bank',             type: 'State-owned' },
    { id: 'BP003', name: 'BRAC Bank',               type: 'Private'     },
    { id: 'BP004', name: 'City Bank Ltd',           type: 'Private'     },
    { id: 'BP005', name: 'Dutch-Bangla Bank',       type: 'Private'     },
    { id: 'BP006', name: 'Standard Chartered BD',  type: 'Foreign'     },
    { id: 'BP007', name: 'Islami Bank Bangladesh', type: 'Islamic'     },
    { id: 'BP008', name: 'HSBC Bangladesh',         type: 'Foreign'     },
    { id: 'BP009', name: 'Al-Arafah Islami Bank',  type: 'Islamic'     },
  ];

  readonly portfolios: Portfolio[] = [
    { id: 'PRTF-001', name: 'Banking Book – Core',    bookType: 'BANKING', status: 'ACTIVE' },
    { id: 'PRTF-002', name: 'Trading Book – FX Desk', bookType: 'TRADING', status: 'ACTIVE' },
    { id: 'PRTF-003', name: 'ALM Book',               bookType: 'ALM',     status: 'ACTIVE' },
  ];

  readonly instruments: Instrument[] = [
    { id: 'FTD',   name: 'Fixed Term Deposit', category: 'Deposit',  cashflow: 'Bullet', compounding: true,  pricing: 'SIMPLE',      isDiscount: false },
    { id: 'CALL',  name: 'Call Deposit',        category: 'Deposit',  cashflow: 'Bullet', compounding: false, pricing: 'SIMPLE',      isDiscount: false },
    { id: 'OND',   name: 'Overnight Deposit',   category: 'Deposit',  cashflow: 'Bullet', compounding: false, pricing: 'SIMPLE',      isDiscount: false },
    { id: 'REPO',  name: 'Repo Agreement',      category: 'Lending',  cashflow: 'Bullet', compounding: false, pricing: 'SIMPLE',      isDiscount: false },
    { id: 'TBILL', name: 'Treasury Bill',       category: 'Security', cashflow: 'Bullet', compounding: false, pricing: 'DISCOUNTING', isDiscount: true  },
    { id: 'DDEP',  name: 'Discount Deposit',    category: 'Deposit',  cashflow: 'Bullet', compounding: false, pricing: 'DISCOUNTING', isDiscount: true  },
  ];

  readonly currencies: Currency[] = [
    { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩' },
    { code: 'USD', name: 'US Dollar',         flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro',              flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound',     flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen',      flag: '🇯🇵' },
    { code: 'SGD', name: 'Singapore Dollar',  flag: '🇸🇬' },
    { code: 'AED', name: 'UAE Dirham',        flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal',       flag: '🇸🇦' },
  ];

  // ─── Step 1 — Deal Basics ─────────────────────────────────────────────

  readonly step1 = new FormGroup({
    dealId:         new FormControl(`MM-${new Date().getFullYear()}-00001`),
    dealDate:       new FormControl(this.toIsoDate(new Date()), Validators.required),
    dealTime:       new FormControl(''),
    dealerId:       new FormControl('USR001', Validators.required),
    counterpartyId: new FormControl('', Validators.required),
    direction:      new FormControl<'ACCEPT' | 'PLACE'>('ACCEPT', Validators.required),
    pricingType:    new FormControl<'NORMAL' | 'DISCOUNTING'>('NORMAL', Validators.required),
    portfolioId:    new FormControl('', Validators.required),
    instrumentId:   new FormControl('', Validators.required),
  });

  // ─── Step 2 — Deposit & Dates ─────────────────────────────────────────

  readonly step2 = new FormGroup({
    depositType:     new FormControl('TERM',                     Validators.required),
    currency:        new FormControl('BDT',                      Validators.required),
    amount:          new FormControl('', [Validators.required, Validators.min(1)]),
    valueDate:       new FormControl(this.toIsoDate(new Date()), Validators.required),
    depositPeriod:   new FormControl(''),
    maturityDate:    new FormControl(''),
    compoundingRule: new FormControl('NONE'),
  });

  // ─── Step 3 — Interest & Calculation ─────────────────────────────────

  readonly step3 = new FormGroup({
    interestBasis:   new FormControl<'FIXED' | 'FLOATING'>('FIXED', Validators.required),
    interestRate:    new FormControl(''),
    benchmark:       new FormControl(''),
    benchmarkPeriod: new FormControl(''),
    spread:          new FormControl(''),
    fixingFrequency: new FormControl(''),
    dayCountRule:    new FormControl('ACT365'),
    settlementFreq:  new FormControl('AT_MATURITY'),
    backStubPeriod:  new FormControl('NONE'),
    includeFirstDay: new FormControl(true),
    marketRate:      new FormControl(''),
    remarks:         new FormControl(''),
  });

  // ─── Helpers ─────────────────────────────────────────────────────────

  getDealer(id: string): Dealer | undefined {
    return this.dealers.find(d => d.id === id);
  }

  getCounterparty(id: string): Counterparty | undefined {
    return this.counterparties.find(c => c.id === id);
  }

  getInstrument(id: string): Instrument | undefined {
    return this.instruments.find(i => i.id === id);
  }

  getPortfolio(id: string): Portfolio | undefined {
    return this.portfolios.find(p => p.id === id);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  cpTypeBadge(type: string): string {
    const map: Record<string, string> = {
      'State-owned': 'navy', Private: 'teal', Foreign: 'purple', Islamic: 'amber',
    };
    return map[type] ?? 'neutral';
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
