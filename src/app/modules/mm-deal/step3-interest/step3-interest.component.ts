import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { DealFormService } from '../deal-form.service';
import { DealStepBarComponent } from '../deal-step-bar/deal-step-bar.component';
import { MmDealApiService, MmDealPayload } from '../mm-deal-api.service';

export interface CashFlowRow {
  date: string;
  type: 'Pay' | 'Rec';
  event: string;
  amount: number;
  isMaturity: boolean;
}

@Component({
  selector: 'app-step3-interest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TmsSelectComponent, DealStepBarComponent],
  animations: [
    trigger('cardSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(40px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0, transform: 'translateX(-40px)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', overflow: 'hidden', opacity: 0 }),
        animate('220ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('160ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ]),
    trigger('overlayFade', [
      transition(':enter', [style({ opacity: 0 }), animate('150ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease', style({ opacity: 0 }))])
    ])
  ],
  templateUrl: './step3-interest.component.html',
  styleUrl:    './step3-interest.component.scss'
})
export class Step3InterestComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  showModal    = false;
  showToast    = false;
  toastMsg     = '';
  toastIsError = false;
  showInboxBtn = false;

  benchmarkOptions = [
    { id: 'SOFR',       label: 'SOFR',      name: 'Secured Overnight Financing Rate' },
    { id: 'LIBOR',      label: 'LIBOR',     name: 'London Interbank Offered Rate'    },
    { id: 'EURIBOR',    label: 'EURIBOR',   name: 'Euro Interbank Offered Rate'      },
    { id: 'BB-RATE',    label: 'BB Rate',   name: 'Bangladesh Bank Rate'             },
    { id: 'CALL-RATE',  label: 'Call Rate', name: 'Call Money Rate'                  },
    { id: 'TBILL91',    label: 'T-Bill 91', name: '91-Day Treasury Bill Rate'        },
  ];

  benchmarkPeriodOptions = [
    { id: 'ON', label: 'O/N', name: 'Overnight' },
    { id: '1W', label: '1W',  name: '1 Week'    },
    { id: '1M', label: '1M',  name: '1 Month'   },
    { id: '3M', label: '3M',  name: '3 Months'  },
    { id: '6M', label: '6M',  name: '6 Months'  },
  ];

  fixingFreqOptions = [
    { id: 'DAILY',    label: 'Daily'    },
    { id: 'WEEKLY',   label: 'Weekly'   },
    { id: 'MONTHLY',  label: 'Monthly'  },
    { id: 'AT_RESET', label: 'At Reset' },
  ];

  settlementFreqOptions = [
    { id: 'AT_MATURITY', label: 'At Maturity' },
    { id: 'MONTHLY',     label: 'Monthly'     },
    { id: 'QUARTERLY',   label: 'Quarterly'   },
    { id: 'SEMI_ANNUAL', label: 'Semi-Annual' },
    { id: 'ANNUAL',      label: 'Annual'      },
  ];

  backStubOptions = [
    { id: 'NONE',  label: 'None',        desc: 'No stub period — the first coupon is a full standard period.'   },
    { id: 'SHORT', label: 'Short Front', desc: 'The first coupon period is shorter than the standard period.'   },
    { id: 'LONG',  label: 'Long Front',  desc: 'The first coupon period is longer than the standard period.'    },
  ];

  dayCountOptions = [
    { id: 'ACT365',  label: 'ACT / 365', sub: 'Actual days / 365',              example: '183 / 365' },
    { id: 'ACTACT',  label: 'ACT / ACT', sub: 'Actual days / actual year days', example: '183 / 366' },
    { id: 'DC30360', label: '30 / 360',  sub: '30-day months / 360-day year',   example: '180 / 360' },
    { id: 'ACT360',  label: 'ACT / 360', sub: 'Actual days / 360',              example: '183 / 360' },
  ];

  rateRangeValue = 0;

  constructor(
    public svc: DealFormService,
    private mmDealApi: MmDealApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const rv = parseFloat(this.step3.get('interestRate')?.value ?? '');
    if (!isNaN(rv)) this.rateRangeValue = Math.min((rv / 20) * 100, 100);

    this.applyBasisValidators(this.interestBasis);

    this.step3.get('interestBasis')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => this.applyBasisValidators(b ?? 'FIXED'));

    this.step3.get('interestRate')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        const n = parseFloat(v ?? '');
        if (!isNaN(n)) this.rateRangeValue = Math.min((n / 20) * 100, 100);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Accessors ────────────────────────────────────────────────────────

  get step1() { return this.svc.step1; }
  get step2() { return this.svc.step2; }
  get step3() { return this.svc.step3; }

  get interestBasis()   { return this.step3.get('interestBasis')?.value  as string;  }
  get dayCountRule()    { return this.step3.get('dayCountRule')?.value    as string;  }
  get settlementFreq()  { return this.step3.get('settlementFreq')?.value  as string;  }
  get backStubPeriod()  { return this.step3.get('backStubPeriod')?.value  as string;  }
  get includeFirstDay() { return this.step3.get('includeFirstDay')?.value as boolean; }

  get depositDays(): number {
    const v = this.step2.get('valueDate')?.value;
    const m = this.step2.get('maturityDate')?.value;
    if (!v || !m) return 0;
    return Math.round((new Date(m).getTime() - new Date(v).getTime()) / 86_400_000);
  }

  get dayCountBasis(): number {
    const map: Record<string, number> = { ACT365: 365, ACTACT: 365, DC30360: 360, ACT360: 360 };
    return map[this.dayCountRule ?? 'ACT365'] ?? 365;
  }

  get effectiveRate(): number {
    if (this.interestBasis === 'FIXED') {
      return parseFloat(this.step3.get('interestRate')?.value ?? '') || 0;
    }
    const mRate  = parseFloat(this.step3.get('marketRate')?.value ?? '') || 0;
    const spread = parseFloat(this.step3.get('spread')?.value ?? '') || 0;
    return mRate + spread / 100;
  }

  get principal(): number {
    return parseFloat(this.step2.get('amount')?.value ?? '') || 0;
  }

  get maturityValue(): number {
    const p    = this.principal;
    const rate = this.effectiveRate;
    const days = this.depositDays;
    if (!p || !rate || !days) return 0;
    return p + p * (rate / 100) * (days / this.dayCountBasis);
  }

  get interestAmount(): number {
    return this.maturityValue > 0 ? this.maturityValue - this.principal : 0;
  }

  get rateRangeFill(): string { return `${this.rateRangeValue}%`; }

  get backStubDesc(): string {
    return this.backStubOptions.find(o => o.id === this.backStubPeriod)?.desc ?? '';
  }

  get s1Counterparty() { return this.svc.getCounterparty(this.step1.get('counterpartyId')?.value ?? ''); }
  get s1Instrument()   { return this.svc.getInstrument(this.step1.get('instrumentId')?.value ?? '');    }
  get s1Direction()    { return this.step1.get('direction')?.value as string; }

  // ─── Rate range ────────────────────────────────────────────────────────

  onRangeInput(e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    this.rateRangeValue = v;
    this.step3.patchValue({ interestRate: ((v / 100) * 20).toFixed(2) });
  }

  // ─── Setters ──────────────────────────────────────────────────────────

  setInterestBasis(val: 'FIXED' | 'FLOATING'): void {
    if (val === this.interestBasis) return;
    this.step3.patchValue({ interestBasis: val });
  }

  setDayCount(id: string): void {
    this.step3.patchValue({ dayCountRule: id });
  }

  // ─── Cash flow schedule ───────────────────────────────────────────────

  get cashFlowRows(): CashFlowRow[] {
    const freq = this.settlementFreq;
    if (!freq || freq === 'AT_MATURITY') return [];
    const p  = this.principal;
    const r  = this.effectiveRate;
    const vd = this.step2.get('valueDate')?.value;
    const md = this.step2.get('maturityDate')?.value;
    if (!p || !r || !vd || !md) return [];

    const stepMonths: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
    const step = stepMonths[freq] ?? 3;
    const dcb  = this.dayCountBasis;
    const dir  = this.step1.get('direction')?.value;
    const type: 'Pay' | 'Rec' = dir === 'PLACE' ? 'Rec' : 'Pay';

    const rows: CashFlowRow[] = [];
    let cur = new Date(vd);
    const mDate = new Date(md);

    while (true) {
      const periodStart = new Date(cur);
      const nxt = new Date(cur);
      nxt.setMonth(nxt.getMonth() + step);

      if (nxt >= mDate) {
        const pd = Math.round((mDate.getTime() - periodStart.getTime()) / 86_400_000);
        rows.push({ date: this.toIso(mDate), type, event: 'Final Interest + Principal', amount: p + p * (r / 100) * (pd / dcb), isMaturity: true });
        break;
      }

      const pd = Math.round((nxt.getTime() - periodStart.getTime()) / 86_400_000);
      rows.push({ date: this.toIso(nxt), type, event: 'Interest Payment', amount: p * (r / 100) * (pd / dcb), isMaturity: false });
      cur = nxt;
    }
    return rows;
  }

  // ─── Validation ───────────────────────────────────────────────────────

  private applyBasisValidators(basis: string): void {
    const rate = this.step3.get('interestRate')!;
    const bm   = this.step3.get('benchmark')!;
    const bmp  = this.step3.get('benchmarkPeriod')!;
    const ff   = this.step3.get('fixingFrequency')!;

    if (basis === 'FIXED') {
      rate.setValidators([Validators.required, Validators.min(0.001)]);
      bm.clearValidators(); bmp.clearValidators(); ff.clearValidators();
    } else {
      rate.clearValidators();
      bm.setValidators(Validators.required);
      bmp.setValidators(Validators.required);
      ff.setValidators(Validators.required);
    }
    [rate, bm, bmp, ff].forEach(c => c.updateValueAndValidity({ emitEvent: false }));
  }

  // ─── Submit ────────────────────────────────────────────────────────────

  onNext(): void {
    this.applyBasisValidators(this.interestBasis);
    this.step3.markAllAsTouched();
    if (this.step3.invalid) return;
    this.showModal = true;
  }

  confirmSubmit(): void {
    this.showModal = false;
    this.mmDealApi.submitDeal(this.buildPayload()).subscribe({
      next: ({ dealId }) => {
        this.router.navigate(['/blotter']);
      },
      error: () => {
        this.toastIsError = true;
        this.toastMsg  = 'Deal submission failed. Please try again.';
        this.showToast = true;
        setTimeout(() => { this.showToast = false; this.toastIsError = false; this.cdr.detectChanges(); }, 4000);
      }
    });
  }

  private buildPayload(): MmDealPayload {
    const s1 = this.step1.getRawValue();
    const s2 = this.step2.getRawValue();
    const s3 = this.step3.getRawValue();
    return {
      dealId:          s1['dealId'] ?? '',
      productId:       'MM',
      instrumentId:    s1['instrumentId'] ?? '',
      portfolioId:     s1['portfolioId'] ?? '',
      dealDate:        s1['dealDate'] ?? '',
      dealTime:        s1['dealTime'] || new Date().toTimeString().slice(0, 5),
      dealerId:        s1['dealerId'] ?? '',
      counterpartyId:  s1['counterpartyId'] ?? '',
      valueDate:       s2['valueDate'] ?? '',
      maturityDate:    s2['maturityDate'] ?? '',
      dealType:        s1['direction'] ?? '',
      depositType:     s2['depositType'] ?? '',
      pricingType:     s1['pricingType'] ?? '',
      currency:        s2['currency'] ?? '',
      principalAmount: parseFloat(s2['amount'] ?? '0') || 0,
      maturityAmount:  this.maturityValue,
      interestBasis:   s3['interestBasis'] ?? '',
      interestRate:    s3['interestRate']    ? parseFloat(s3['interestRate'])    : null,
      spread:          s3['spread']          ? parseFloat(s3['spread'])          : null,
      benchmarkId:     s3['benchmark']       || null,
      dayCount:        s3['dayCountRule']    ?? '',
      compoundingFlag: s2['compoundingRule'] !== 'NONE' && !!s2['compoundingRule'],
      compoundFreq:    s2['compoundingRule'] !== 'NONE' ? s2['compoundingRule'] : null,
      fixingFreq:      s3['fixingFrequency'] || null,
      settlementFreq:  s3['settlementFreq']  ?? '',
    };
  }

  cancelModal(): void { this.showModal = false; }

  saveDraft(): void {
    this.toastMsg = 'Draft saved.';
    this.showToast = true;
    setTimeout(() => { this.showToast = false; this.cdr.detectChanges(); }, 3000);
  }

  // ─── Utils ────────────────────────────────────────────────────────────

  private toIso(d: Date): string { return d.toISOString().split('T')[0]; }

  fmtNum(n: number, dp = 2): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
  }

  fmtDate(iso: string): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  }
}
