import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';
import { BottomNavComponent } from '../../../core/layout/bottom-nav/bottom-nav';
import { UpperFooterComponent } from '../../../core/layout/upper-footer/upper-footer.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { ApprovalsService } from '../../../core/services/approvals.service';
import { Subscription } from 'rxjs';
import { InfobarService } from '../../../core/layout/infobar.service';
import { FooterActionService } from '../../../core/layout/footer-action.service';

interface Instrument {
  value: string;
  label: string;
  pricingType: string;
  dayCount: string;
  compoundingAllowed: boolean;
}

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TmsSelectComponent, BottomNavComponent, UpperFooterComponent],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', overflow: 'hidden', opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('150ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ]),
    trigger('stripIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './product-create.component.html',
  styleUrl:    './product-create.component.scss'
})
export class ProductCreateComponent implements OnInit, OnDestroy {

  private approvalsService    = inject(ApprovalsService);
  private router              = inject(Router);
  private cdr                 = inject(ChangeDetectorRef);
  private infobarService      = inject(InfobarService);
  private footerActionService = inject(FooterActionService);
  private formSub             = new Subscription();

  readonly productCode = `PROD-${new Date().getFullYear()}-005`;
  readonly today       = new Date().toISOString().split('T')[0];

  dpOpen = true;

  // ── Options ───────────────────────────────────────────────────────────────

  readonly dealTypeOptions = [
    { value: 'CALL', label: 'Call' },
    { value: 'TIME', label: 'Time' },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      name:          new FormControl('',         [Validators.required, Validators.maxLength(80)]),
      dealType:      new FormControl(null,        Validators.required),
      direction:     new FormControl('ACCEPT',    Validators.required),
      rateType:      new FormControl('FIXED',     Validators.required),
      effectiveDate: new FormControl(this.today,  Validators.required),
      status:        new FormControl(true),
    });

    this.updateInfobar();
    this.formSub.add(
      this.form.valueChanges.subscribe(() => this.updateInfobar())
    );
    this.formSub.add(
      this.footerActionService.action$.subscribe(action => {
        if (action === 'cancel') this.onCancel();
        if (action === 'draft')  this.saveDraft();
        if (action === 'submit') this.onSubmit();
      })
    );
  }

  private updateInfobar(): void {
    const status = this.form.get('status')?.value;
    this.infobarService.setFields([
      { label: 'PRODUCT ID', value: this.productCode },
      { label: 'NAME',       value: this.form.get('name')?.value || '' },
      { label: 'STATUS',     value: status === true ? 'Active' : 'Inactive' },
    ]);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.infobarService.setFields([]);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get statusActive() { return this.form.get('status')?.value as boolean; }
  get rateTypeFixed() { return this.form.get('rateType')?.value === 'FIXED'; }

  setRateType(val: string): void { this.form.patchValue({ rateType: val }); }

  // ── Actions ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const el = document.querySelector('.ng-invalid.ng-touched:not(form)') as HTMLElement | null;
      el?.closest('.de-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this.approvalsService.increment();
    this.showToast(
      `Product ${this.productCode} submitted for approval. Check Authorization Inbox.`,
      'success'
    );
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  saveDraft(): void {
    this.showToast('Draft saved successfully.', 'info');
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'info' = 'success';

  private showToast(msg: string, type: 'success' | 'info'): void {
    this.toastMessage = msg;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 3500);
  }
}
