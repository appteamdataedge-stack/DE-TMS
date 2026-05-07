import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { DealFormService } from '../deal-form.service';
import { DealStepBarComponent } from '../deal-step-bar/deal-step-bar.component';

export interface ScheduleRow {
  n: number;
  date: string;
  type: string;
  period: string;
  isMaturity: boolean;
}

function futureDateValidator(ctrl: AbstractControl): ValidationErrors | null {
  if (!ctrl.value) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(ctrl.value) >= today ? null : { pastDate: true };
}

@Component({
  selector: 'app-step2-deposit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TmsSelectComponent, DealStepBarComponent],
  animations: [
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
  templateUrl: './step2-deposit.component.html',
  styleUrl:    './step2-deposit.component.scss'
})
export class Step2DepositComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Amount display
  rawAmount = '';

  // Period button state
  activePeriodBtn = '';

  // Summary preview data (debounced)
  summaryData: Record<string, string> = {};

  compoundingOptions = [
    {
      id: 'NONE', label: 'No Compounding', sub: 'Single payment at maturity',
      icon: `<line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 3"/>`
    },
    {
      id: 'F1', label: 'Monthly', sub: 'Capitalise every month',
      icon: `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="13" y1="4" x2="13" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="4" x2="18" y2="9" stroke="currentColor" stroke-width="1.5"/>`
    },
    {
      id: 'F3', label: 'Quarterly', sub: 'Capitalise every 3 months',
      icon: `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="4" x2="9" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="4" x2="15" y2="9" stroke="currentColor" stroke-width="1.5"/>`
    },
    {
      id: 'F6', label: 'Semi-Annual', sub: 'Capitalise every 6 months',
      icon: `<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="4" x2="12" y2="9" stroke="currentColor" stroke-width="1.5"/>`
    },
  ];

  quickPeriods = [
    { label: '1W',  months: 0,  days: 7   },
    { label: '1M',  months: 1,  days: 0   },
    { label: '3M',  months: 3,  days: 0   },
    { label: '6M',  months: 6,  days: 0   },
    { label: '9M',  months: 9,  days: 0   },
    { label: '1Y',  months: 12, days: 0   },
    { label: '2Y',  months: 24, days: 0   },
  ];

  showToast = false;
  toastMsg  = '';

  constructor(
    public svc: DealFormService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Restore display amount from form
    const v = this.step2.get('amount')?.value;
    if (v) this.rawAmount = this.fmtNum(parseFloat(v));

    // Re-apply maturityDate validator based on current depositType
    this.applyMaturityValidator(this.depositType);

    // Watch depositType: lock compounding for CALL
    this.step2.get('depositType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
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

    // Debounced summary
    this.step2.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.refreshSummary());

    this.refreshSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Accessors ────────────────────────────────────────────────────────

  get step1() { return this.svc.step1; }
  get step2() { return this.svc.step2; }

  get depositType()     { return this.step2.get('depositType')?.value as string; }
  get compoundingRule() { return this.step2.get('compoundingRule')?.value as string; }
  get amountLabel()     { return (this.step1.get('pricingType')?.value as string) === 'DISCOUNTING' ? 'MATURITY AMOUNT' : 'FACE VALUE AMOUNT'; }

  get depositDays(): number {
    const v = this.step2.get('valueDate')?.value;
    const m = this.step2.get('maturityDate')?.value;
    if (!v || !m) return 0;
    return Math.round((new Date(m).getTime() - new Date(v).getTime()) / 86_400_000);
  }

  get selectedCurrencyFlag(): string {
    const code = this.step2.get('currency')?.value;
    return this.svc.currencies.find(c => c.code === code)?.flag ?? '';
  }

  // Step 1 summary chips
  get s1Counterparty() { return this.svc.getCounterparty(this.step1.get('counterpartyId')?.value ?? ''); }
  get s1Instrument()   { return this.svc.getInstrument(this.step1.get('instrumentId')?.value ?? ''); }
  get s1Direction()    { return this.step1.get('direction')?.value as string; }
  get s1PricingType()  { return this.step1.get('pricingType')?.value as string; }

  // ─── Amount helpers ───────────────────────────────────────────────────

  onAmountInput(): void {
    // Clear the period button highlight when amount changes
  }

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

  get formattedDisplay(): string {
    const n = parseFloat(this.step2.get('amount')?.value ?? '');
    if (!n || isNaN(n)) return '';
    const ccy = this.step2.get('currency')?.value ?? 'BDT';
    return `= ${ccy} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n)}`;
  }

  // ─── Period buttons ───────────────────────────────────────────────────

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

  // ─── Compounding schedule ─────────────────────────────────────────────

  get compoundSchedule(): ScheduleRow[] {
    const rule = this.compoundingRule;
    if (!rule || rule === 'NONE') return [];
    const v = this.step2.get('valueDate')?.value;
    const m = this.step2.get('maturityDate')?.value;
    if (!v || !m) return [];

    const vDate = new Date(v);
    const mDate = new Date(m);
    if (mDate <= vDate) return [];

    const step = ({ F1: 1, F3: 3, F6: 6 } as Record<string,number>)[rule] ?? 1;
    const rows: ScheduleRow[] = [];
    let cur = new Date(vDate); let n = 0;

    while (true) {
      const nxt = new Date(cur); nxt.setMonth(nxt.getMonth() + step);
      if (nxt >= mDate) break;
      n++;
      rows.push({ n, date: this.toIso(nxt), type: 'Capitalise', period: `${step}M`, isMaturity: false });
      cur = nxt;
    }
    n++;
    rows.push({ n, date: this.toIso(mDate), type: 'Maturity', period: `${this.depositDays}D`, isMaturity: true });
    return rows;
  }

  setCompounding(id: string): void {
    if (this.depositType === 'CALL') return;
    this.step2.patchValue({ compoundingRule: id });
  }

  // ─── Summary preview ──────────────────────────────────────────────────

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

  // ─── Validation helpers ───────────────────────────────────────────────

  private applyMaturityValidator(t: string): void {
    const ctrl = this.step2.get('maturityDate')!;
    if (t === 'TERM') ctrl.setValidators([Validators.required, futureDateValidator]);
    else              ctrl.clearValidators();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  // ─── Actions ─────────────────────────────────────────────────────────

  onNext(): void {
    this.applyMaturityValidator(this.depositType);
    this.step2.markAllAsTouched();
    if (this.step2.invalid) return;
    this.router.navigate(['/mm-deal/create/interest']);
  }

  saveDraft(): void {
    this.toastMsg = 'Draft saved.'; this.showToast = true;
    setTimeout(() => { this.showToast = false; this.cdr.detectChanges(); }, 3000);
  }

  // ─── Utils ────────────────────────────────────────────────────────────

  private toIso(d: Date): string { return d.toISOString().split('T')[0]; }

  get todayStr(): string { return this.toIso(new Date()); }

  fmtNum(n: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  }

  fmtDate(iso: string): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  }
}
