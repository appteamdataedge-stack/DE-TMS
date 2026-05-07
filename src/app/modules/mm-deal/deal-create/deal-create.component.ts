import { Component, ElementRef, HostListener, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';
import { BottomNavComponent } from '../../../core/layout/bottom-nav/bottom-nav';
import { UpperFooterComponent } from '../../../core/layout/upper-footer/upper-footer.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { DealFormService, Counterparty, Instrument } from '../deal-form.service';
import { MmDealApiService, MmDealPayload } from '../mm-deal-api.service';
import { InfobarService } from '../../../core/layout/infobar.service';
import { FooterActionService } from '../../../core/layout/footer-action.service';

export type DcPanel =
  | 'basics' | 'deposit' | 'interest'
  | 'settlement-principal' | 'settlement-interest'
  | 'additional' | 'charges' | 'bdc' | 'messages' | 'schedule';

function futureDateValidator(ctrl: AbstractControl): ValidationErrors | null {
  if (!ctrl.value) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(ctrl.value) >= today ? null : { pastDate: true };
}

@Component({
  selector: 'app-deal-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TmsSelectComponent, BottomNavComponent, UpperFooterComponent],
  animations: [
    trigger('panelFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
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
    ]),
    trigger('groupCollapse', [
      transition(':enter', [
        style({ height: '0', overflow: 'hidden', opacity: 0 }),
        animate('180ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('140ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ]),
  ],
  templateUrl: './deal-create.component.html',
  styleUrl:    './deal-create.component.scss'
})
export class DealCreateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── Sidebar state ─────────────────────────────────────────────────────────
  activePanel: DcPanel = 'basics';
  basicInfoExpanded = true;
  settlementExpanded = false;

  setPanel(panel: string): void { this.activePanel = panel as DcPanel; }

  toggleGroup(group: 'basicInfo' | 'settlement'): void {
    if (group === 'basicInfo') this.basicInfoExpanded = !this.basicInfoExpanded;
    else                       this.settlementExpanded = !this.settlementExpanded;
  }

  // ── Step 1 state ──────────────────────────────────────────────────────────
  cpSearch = '';
  cpDropdownVisible = false;
  selectedCP: Counterparty | null = null;

  // ── Step 2 state ──────────────────────────────────────────────────────────
  rawAmount = '';
  activePeriodBtn = '';
  summaryData: Record<string, string> = {};

  compoundingOptions = [
    { id: 'NONE', label: 'No Compounding', sub: 'Single payment at maturity',
      icon: `<line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 3"/>` },
    { id: 'F1',   label: 'Monthly',     sub: 'Capitalise every month',
      icon: `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="13" y1="4" x2="13" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="4" x2="18" y2="9" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'F3',   label: 'Quarterly',   sub: 'Capitalise every 3 months',
      icon: `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="4" x2="9" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="4" x2="15" y2="9" stroke="currentColor" stroke-width="1.5"/>` },
    { id: 'F6',   label: 'Semi-Annual', sub: 'Capitalise every 6 months',
      icon: `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="4" x2="12" y2="9" stroke="currentColor" stroke-width="1.5"/>` },
  ];

  quickPeriods = [
    { label: '1W', months: 0,  days: 7  },
    { label: '1M', months: 1,  days: 0  },
    { label: '3M', months: 3,  days: 0  },
    { label: '6M', months: 6,  days: 0  },
    { label: '9M', months: 9,  days: 0  },
    { label: '1Y', months: 12, days: 0  },
    { label: '2Y', months: 24, days: 0  },
  ];

  // ── Charges state ─────────────────────────────────────────────────────────
  chargeRows = [
    { type: 'Brokerage Commission', currency: 'BDT', amount: 5_000,  rate: '0.05%', basis: 'On Principal' },
    { type: 'Stamp Duty',           currency: 'BDT', amount:   500,  rate: 'Fixed', basis: '—' },
  ];

  // ── BDC state ─────────────────────────────────────────────────────────────
  bdcRule = 'MOD_FOLLOWING';

  bdcRuleOptions = [
    { id: 'FOLLOWING',     label: 'Following',          name: 'Adjust to next valid business day' },
    { id: 'MOD_FOLLOWING', label: 'Modified Following', name: 'Next valid day, capped within month' },
    { id: 'PRECEDING',     label: 'Preceding',          name: 'Adjust to previous valid business day' },
    { id: 'MOD_PRECEDING', label: 'Modified Preceding', name: 'Previous valid day, capped within month' },
  ];

  // ── Step 3 state ──────────────────────────────────────────────────────────
  showModal    = false;
  showToast    = false;
  toastMsg     = '';
  toastType: 'success' | 'warning' = 'success';
  toastIsError = false;
  showInboxBtn = false;
  rateRangeValue = 0;

  benchmarkOptions = [
    { id: 'SOFR',      label: 'SOFR',      name: 'Secured Overnight Financing Rate' },
    { id: 'LIBOR',     label: 'LIBOR',     name: 'London Interbank Offered Rate'    },
    { id: 'EURIBOR',   label: 'EURIBOR',   name: 'Euro Interbank Offered Rate'      },
    { id: 'BB-RATE',   label: 'BB Rate',   name: 'Bangladesh Bank Rate'             },
    { id: 'CALL-RATE', label: 'Call Rate', name: 'Call Money Rate'                  },
    { id: 'TBILL91',   label: 'T-Bill 91', name: '91-Day Treasury Bill Rate'        },
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

  private footerActionService = inject(FooterActionService);

  constructor(
    public  svc:           DealFormService,
    private mmDealApi:     MmDealApiService,
    private router:        Router,
    private elRef:         ElementRef,
    private cdr:           ChangeDetectorRef,
    private infobarService: InfobarService
  ) {}

  ngOnInit(): void {
    // ── Step 1 ────────────────────────────────────────────────────────────
    const cpId = this.step1.get('counterpartyId')?.value;
    if (cpId) this.selectedCP = this.svc.getCounterparty(cpId) ?? null;

    this.step1.get('instrumentId')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(instId => {
        const inst = this.svc.getInstrument(instId ?? '');
        if (inst?.isDiscount && this.pricingType !== 'DISCOUNTING') {
          this.step1.patchValue({ pricingType: 'DISCOUNTING' });
          this.flash('Pricing automatically changed to Discounting for this instrument', 'warning');
        }
      });

    // ── Step 2 ────────────────────────────────────────────────────────────
    const v = this.step2.get('amount')?.value;
    if (v) this.rawAmount = this.fmtNum(parseFloat(v));

    this.applyMaturityValidator(this.depositType);

    this.step2.get('depositType')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(t => {
        this.applyMaturityValidator(t ?? 'TERM');
        if (t === 'CALL') {
          this.step2.patchValue({ compoundingRule: 'NONE', maturityDate: '' });
          this.step2.get('compoundingRule')!.disable();
          this.activePeriodBtn = '';
        } else {
          this.step2.get('compoundingRule')!.enable();
        }
      });

    this.step2.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.refreshSummary());

    this.refreshSummary();

    // ── Step 3 ────────────────────────────────────────────────────────────
    const rv = parseFloat(this.step3.get('interestRate')?.value ?? '');
    if (!isNaN(rv)) this.rateRangeValue = Math.min((rv / 20) * 100, 100);

    this.applyBasisValidators(this.interestBasis);

    this.step3.get('interestBasis')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(b => this.applyBasisValidators(b ?? 'FIXED'));

    this.step3.get('interestRate')!.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const n = parseFloat(val ?? '');
        if (!isNaN(n)) this.rateRangeValue = Math.min((n / 20) * 100, 100);
      });

    this.updateInfobar();
    this.step1.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateInfobar());

    this.footerActionService.action$.pipe(takeUntil(this.destroy$)).subscribe(action => {
      if (action === 'cancel') this.onCancel();
      if (action === 'draft')  this.saveDraft();
      if (action === 'submit') this.onSubmit();
    });
  }

  private updateInfobar(): void {
    this.infobarService.setFields([
      { label: 'DEAL DATE',    value: this.summaryDealDate },
      { label: 'DEALER',       value: this.summaryDealer },
      { label: 'PORTFOLIO',    value: this.summaryPortfolio },
      { label: 'COUNTERPARTY', value: this.summaryCounterparty },
      { label: 'INSTRUMENT',   value: this.summaryInstrument },
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.infobarService.setFields([]);
  }

  // ── Form accessors ────────────────────────────────────────────────────────

  get step1() { return this.svc.step1; }
  get step2() { return this.svc.step2; }
  get step3() { return this.svc.step3; }

  get direction()    { return this.step1.get('direction')?.value   as string; }
  get pricingType()  { return this.step1.get('pricingType')?.value as string; }
  get depositType()  { return this.step2.get('depositType')?.value as string; }
  get compoundingRule() { return this.step2.get('compoundingRule')?.value as string; }
  get interestBasis()   { return this.step3.get('interestBasis')?.value  as string; }
  get dayCountRule()    { return this.step3.get('dayCountRule')?.value    as string; }
  get settlementFreq()  { return this.step3.get('settlementFreq')?.value  as string; }
  get backStubPeriod()  { return this.step3.get('backStubPeriod')?.value  as string; }
  get includeFirstDay() { return this.step3.get('includeFirstDay')?.value as boolean; }

  get amountLabel() { return this.pricingType === 'DISCOUNTING' ? 'MATURITY AMOUNT' : 'FACE VALUE AMOUNT'; }

  get selectedInstrument(): Instrument | undefined {
    return this.svc.getInstrument(this.step1.get('instrumentId')?.value ?? '');
  }

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
    if (this.interestBasis === 'FIXED') return parseFloat(this.step3.get('interestRate')?.value ?? '') || 0;
    return (parseFloat(this.step3.get('marketRate')?.value ?? '') || 0) + (parseFloat(this.step3.get('spread')?.value ?? '') || 0) / 100;
  }

  get principal(): number { return parseFloat(this.step2.get('amount')?.value ?? '') || 0; }

  get maturityValue(): number {
    const p = this.principal; const rate = this.effectiveRate; const days = this.depositDays;
    if (!p || !rate || !days) return 0;
    return p + p * (rate / 100) * (days / this.dayCountBasis);
  }

  get interestAmount(): number { return this.maturityValue > 0 ? this.maturityValue - this.principal : 0; }

  get rateRangeFill(): string { return `${this.rateRangeValue}%`; }

  get backStubDesc(): string { return this.backStubOptions.find(o => o.id === this.backStubPeriod)?.desc ?? ''; }

  get s1Counterparty() { return this.svc.getCounterparty(this.step1.get('counterpartyId')?.value ?? ''); }
  get s1Instrument()   { return this.svc.getInstrument(this.step1.get('instrumentId')?.value ?? '');    }
  get s1Direction()    { return this.step1.get('direction')?.value as string; }

  // ── Summary bar live values ────────────────────────────────────────────────
  get summaryDealDate():     string { return this.step1.get('dealDate')?.value ?? ''; }
  get summaryDealer():       string { const id = this.step1.get('dealerId')?.value; return this.svc.dealers.find(d => d.id === id)?.name ?? ''; }
  get summaryPortfolio():    string { const id = this.step1.get('portfolioId')?.value; return this.svc.portfolios.find(p => p.id === id)?.name ?? ''; }
  get summaryCounterparty(): string { return this.selectedCP?.name ?? ''; }
  get summaryInstrument():   string { const id = this.step1.get('instrumentId')?.value; return this.svc.instruments.find(i => i.id === id)?.name ?? ''; }

  get formattedDisplay(): string {
    const n = parseFloat(this.step2.get('amount')?.value ?? '');
    if (!n || isNaN(n)) return '';
    const ccy = this.step2.get('currency')?.value ?? 'BDT';
    return `= ${ccy} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n)}`;
  }

  // ── Counterparty typeahead ─────────────────────────────────────────────────

  get filteredCPs(): Counterparty[] {
    if (this.cpSearch.trim().length < 2) return [];
    const q = this.cpSearch.toLowerCase();
    return this.svc.counterparties.filter(c =>
      c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }

  onCpInput(): void  { this.cpDropdownVisible = this.cpSearch.trim().length >= 2; }
  onCpFocus(): void  { if (this.cpSearch.trim().length >= 2) this.cpDropdownVisible = true; }

  selectCP(cp: Counterparty): void {
    this.selectedCP = cp;
    this.step1.patchValue({ counterpartyId: cp.id });
    this.step1.get('counterpartyId')!.markAsTouched();
    this.cpDropdownVisible = false;
    this.cpSearch = '';
  }

  clearCP(): void {
    this.selectedCP = null;
    this.step1.patchValue({ counterpartyId: '' });
    this.cpSearch = '';
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (this.cpDropdownVisible && !this.elRef.nativeElement.contains(e.target as Node)) {
      this.cpDropdownVisible = false;
    }
  }

  setDirection(val: 'ACCEPT' | 'PLACE'): void       { this.step1.patchValue({ direction: val }); }
  setPricingType(val: 'NORMAL' | 'DISCOUNTING'): void { this.step1.patchValue({ pricingType: val }); }

  // ── Amount helpers ────────────────────────────────────────────────────────

  onAmountInput(): void {}

  onAmountBlur(): void {
    if (!this.rawAmount.trim()) { this.step2.patchValue({ amount: '' }); return; }
    const cleaned = this.rawAmount.replace(/,/g, '').trim().toUpperCase();
    const m = cleaned.match(/^([\d.]+)\s*([KMB])?$/);
    if (!m) { this.step2.get('amount')!.setErrors({ invalidFormat: true }); return; }
    let n = parseFloat(m[1]);
    if (m[2] === 'K') n *= 1_000;
    else if (m[2] === 'M') n *= 1_000_000;
    else if (m[2] === 'B') n *= 1_000_000_000;
    this.step2.patchValue({ amount: n.toString() });
    this.rawAmount = this.fmtNum(n);
  }

  // ── Period buttons ────────────────────────────────────────────────────────

  applyPeriod(p: { label: string; months: number; days: number }): void {
    const vd = this.step2.get('valueDate')?.value;
    if (!vd) return;
    const d = new Date(vd);
    if (p.days) d.setDate(d.getDate() + p.days);
    else         d.setMonth(d.getMonth() + p.months);
    this.step2.patchValue({ maturityDate: this.toIso(d), depositPeriod: p.label });
    this.activePeriodBtn = p.label;
    this.step2.get('maturityDate')!.markAsTouched();
  }

  onMaturityManual(): void { this.activePeriodBtn = ''; }

  onValueDateChange(): void {
    if (this.activePeriodBtn) {
      const p = this.quickPeriods.find(x => x.label === this.activePeriodBtn);
      if (p) this.applyPeriod(p);
    }
  }

  // ── Compounding schedule ──────────────────────────────────────────────────

  get compoundSchedule(): Array<{ n: number; date: string; type: string; period: string; isMaturity: boolean }> {
    const rule = this.compoundingRule;
    if (!rule || rule === 'NONE') return [];
    const v = this.step2.get('valueDate')?.value;
    const m = this.step2.get('maturityDate')?.value;
    if (!v || !m) return [];
    const vDate = new Date(v); const mDate = new Date(m);
    if (mDate <= vDate) return [];
    const step = ({ F1: 1, F3: 3, F6: 6 } as Record<string, number>)[rule] ?? 1;
    const rows: Array<{ n: number; date: string; type: string; period: string; isMaturity: boolean }> = [];
    let cur = new Date(vDate); let n = 0;
    while (true) {
      const nxt = new Date(cur); nxt.setMonth(nxt.getMonth() + step);
      if (nxt >= mDate) break;
      n++; rows.push({ n, date: this.toIso(nxt), type: 'Capitalise', period: `${step}M`, isMaturity: false });
      cur = nxt;
    }
    n++; rows.push({ n, date: this.toIso(mDate), type: 'Maturity', period: `${this.depositDays}D`, isMaturity: true });
    return rows;
  }

  setCompounding(id: string): void { if (this.depositType !== 'CALL') this.step2.patchValue({ compoundingRule: id }); }

  refreshSummary(): void {
    const s = this.step2.getRawValue();
    const n = parseFloat(s['amount'] ?? '');
    const ccy: string = (s['currency'] as string | null) ?? 'BDT';
    this.summaryData = {
      faceValue:     !isNaN(n) && n > 0 ? `${ccy} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n)}` : '—',
      depositType:   s['depositType'] === 'TERM' ? 'Fixed Term' : 'Call Deposit',
      valueDate:     s['valueDate']    ? this.fmtDate(s['valueDate'])    : '—',
      maturityDate:  s['maturityDate'] ? this.fmtDate(s['maturityDate']) : '—',
      depositPeriod: this.depositDays  ? `${this.depositDays} days`      : '—',
      compounding:   s['compoundingRule'] === 'NONE' || !s['compoundingRule'] ? 'None' : s['compoundingRule'],
    };
    this.cdr.detectChanges();
  }

  private applyMaturityValidator(t: string): void {
    const ctrl = this.step2.get('maturityDate')!;
    if (t === 'TERM') ctrl.setValidators([Validators.required, futureDateValidator]);
    else              ctrl.clearValidators();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  // ── Step 3 helpers ────────────────────────────────────────────────────────

  onRangeInput(e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    this.rateRangeValue = v;
    this.step3.patchValue({ interestRate: ((v / 100) * 20).toFixed(2) });
  }

  setInterestBasis(val: 'FIXED' | 'FLOATING'): void {
    if (val === this.interestBasis) return;
    this.step3.patchValue({ interestBasis: val });
  }

  setDayCount(id: string): void { this.step3.patchValue({ dayCountRule: id }); }

  get cashFlowRows(): Array<{ date: string; type: 'Pay' | 'Rec'; event: string; amount: number; isMaturity: boolean }> {
    const freq = this.settlementFreq;
    if (!freq || freq === 'AT_MATURITY') return [];
    const p = this.principal; const r = this.effectiveRate;
    const vd = this.step2.get('valueDate')?.value; const md = this.step2.get('maturityDate')?.value;
    if (!p || !r || !vd || !md) return [];
    const stepMonths: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
    const step = stepMonths[freq] ?? 3;
    const dcb = this.dayCountBasis;
    const type: 'Pay' | 'Rec' = this.step1.get('direction')?.value === 'PLACE' ? 'Rec' : 'Pay';
    const rows: Array<{ date: string; type: 'Pay' | 'Rec'; event: string; amount: number; isMaturity: boolean }> = [];
    let cur = new Date(vd); const mDate = new Date(md);
    while (true) {
      const ps = new Date(cur); const nxt = new Date(cur); nxt.setMonth(nxt.getMonth() + step);
      if (nxt >= mDate) {
        const pd = Math.round((mDate.getTime() - ps.getTime()) / 86_400_000);
        rows.push({ date: this.toIso(mDate), type, event: 'Final Interest + Principal', amount: p + p * (r / 100) * (pd / dcb), isMaturity: true });
        break;
      }
      const pd = Math.round((nxt.getTime() - ps.getTime()) / 86_400_000);
      rows.push({ date: this.toIso(nxt), type, event: 'Interest Payment', amount: p * (r / 100) * (pd / dcb), isMaturity: false });
      cur = nxt;
    }
    return rows;
  }

  get bdcScheduleRows() {
    const dir = this.step1.get('direction')?.value;
    const label = dir === 'PLACE' ? 'Interest Income' : 'Interest Expense';
    return this.cashFlowRows.map((r, i) => ({
      n: i + 1,
      date: r.date,
      type: r.type,
      event: r.isMaturity ? `Final Principal + ${label}` : label,
      amount: r.amount,
      isMaturity: r.isMaturity,
    }));
  }

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

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.applyMaturityValidator(this.depositType);
    this.applyBasisValidators(this.interestBasis);
    this.step1.markAllAsTouched();
    this.step2.markAllAsTouched();
    this.step3.markAllAsTouched();
    const cpId = this.step1.get('counterpartyId')?.value;
    if (cpId && !this.svc.getCounterparty(cpId)) this.step1.get('counterpartyId')!.setErrors({ notFound: true });
    if (this.step1.invalid) { this.setPanel('basics');   return; }
    if (this.step2.invalid) { this.setPanel('deposit');  return; }
    if (this.step3.invalid) { this.setPanel('interest'); return; }
    this.showModal = true;
  }

  confirmSubmit(): void {
    this.showModal = false;
    const dealId = this.step1.get('dealId')?.value ?? '';
    this.mmDealApi.submitDeal(this.buildPayload()).subscribe({
      next: () => this.router.navigate(['/mm-deal', dealId]),
      error: () => {
        this.toastIsError = true;
        this.toastMsg  = 'Deal submission failed. Please try again.';
        this.showToast = true;
        setTimeout(() => { this.showToast = false; this.toastIsError = false; this.cdr.detectChanges(); }, 4000);
      }
    });
  }

  cancelModal(): void { this.showModal = false; }

  saveDraft(): void {
    this.toastMsg = 'Draft saved.'; this.toastIsError = false; this.showToast = true;
    setTimeout(() => { this.showToast = false; this.cdr.detectChanges(); }, 3000);
  }

  onCancel(): void {
    this.router.navigate(['/blotter']);
  }

  private buildPayload(): MmDealPayload {
    const s1 = this.step1.getRawValue(); const s2 = this.step2.getRawValue(); const s3 = this.step3.getRawValue();
    return {
      dealId: s1['dealId'] ?? '', productId: 'MM',
      instrumentId: s1['instrumentId'] ?? '', portfolioId: s1['portfolioId'] ?? '',
      dealDate: s1['dealDate'] ?? '', dealTime: s1['dealTime'] || new Date().toTimeString().slice(0, 5),
      dealerId: s1['dealerId'] ?? '', counterpartyId: s1['counterpartyId'] ?? '',
      valueDate: s2['valueDate'] ?? '', maturityDate: s2['maturityDate'] ?? '',
      dealType: s1['direction'] ?? '', depositType: s2['depositType'] ?? '',
      pricingType: s1['pricingType'] ?? '', currency: s2['currency'] ?? '',
      principalAmount: parseFloat(s2['amount'] ?? '0') || 0, maturityAmount: this.maturityValue,
      interestBasis: s3['interestBasis'] ?? '',
      interestRate: s3['interestRate'] ? parseFloat(s3['interestRate']) : null,
      spread:       s3['spread']       ? parseFloat(s3['spread'])       : null,
      benchmarkId:  s3['benchmark'] || null, dayCount: s3['dayCountRule'] ?? '',
      compoundingFlag: s2['compoundingRule'] !== 'NONE' && !!s2['compoundingRule'],
      compoundFreq:    s2['compoundingRule'] !== 'NONE' ? s2['compoundingRule'] : null,
      fixingFreq:      s3['fixingFrequency'] || null, settlementFreq: s3['settlementFreq'] ?? '',
    };
  }

  // ── Utils ──────────────────────────────────────────────────────────────────

  private flash(msg: string, type: 'success' | 'warning' = 'success'): void {
    this.toastMsg = msg; this.toastType = type; this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  private toIso(d: Date): string { return d.toISOString().split('T')[0]; }

  get todayStr(): string { return this.toIso(new Date()); }

  fmtNum(n: number, dp = 0): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
  }

  fmtDate(iso: string): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  }
}
