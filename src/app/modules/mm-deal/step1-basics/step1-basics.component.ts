import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { DealFormService, Counterparty, Instrument } from '../deal-form.service';
import { DealStepBarComponent } from '../deal-step-bar/deal-step-bar.component';

@Component({
  selector: 'app-step1-basics',
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
  templateUrl: './step1-basics.component.html',
  styleUrl: './step1-basics.component.scss'
})
export class Step1BasicsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  cpSearch = '';
  cpDropdownVisible = false;
  selectedCP: Counterparty | null = null;

  showToast = false;
  toastMsg  = '';
  toastType: 'success' | 'warning' = 'success';

  constructor(
    public svc: DealFormService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    const id = this.step1.get('counterpartyId')?.value;
    if (id) this.selectedCP = this.svc.getCounterparty(id) ?? null;

    // Auto-pricing: switch to DISCOUNTING for discount instruments
    this.step1.get('instrumentId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(instId => {
        const inst = this.svc.getInstrument(instId ?? '');
        if (inst?.isDiscount && this.pricingType !== 'DISCOUNTING') {
          this.step1.patchValue({ pricingType: 'DISCOUNTING' });
          this.flash('Pricing automatically changed to Discounting for this instrument', 'warning');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Accessors ────────────────────────────────────────────────────────

  get step1() { return this.svc.step1; }
  get direction()    { return this.step1.get('direction')?.value   as string; }
  get pricingType()  { return this.step1.get('pricingType')?.value as string; }

  get selectedInstrument(): Instrument | undefined {
    return this.svc.getInstrument(this.step1.get('instrumentId')?.value ?? '');
  }

  // ─── Counterparty typeahead ───────────────────────────────────────────

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

  // ─── Setters ──────────────────────────────────────────────────────────

  setDirection(val: 'ACCEPT' | 'PLACE'): void       { this.step1.patchValue({ direction: val }); }
  setPricingType(val: 'NORMAL' | 'DISCOUNTING'): void { this.step1.patchValue({ pricingType: val }); }

  // ─── Navigation ──────────────────────────────────────────────────────

  onNext(): void {
    this.step1.markAllAsTouched();
    const cpId = this.step1.get('counterpartyId')?.value;
    if (cpId && !this.svc.getCounterparty(cpId)) {
      this.step1.get('counterpartyId')!.setErrors({ notFound: true });
    }
    if (this.step1.invalid) {
      const el = this.elRef.nativeElement.querySelector('.ng-invalid.ng-touched:not(form), .is-invalid');
      el?.closest('.mm-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this.router.navigate(['/mm-deal/create/deposit']);
  }

  saveDraft(): void { this.flash('Draft saved.', 'success'); }

  // ─── Toast ────────────────────────────────────────────────────────────

  private flash(msg: string, type: 'success' | 'warning' = 'success'): void {
    this.toastMsg  = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }
}
