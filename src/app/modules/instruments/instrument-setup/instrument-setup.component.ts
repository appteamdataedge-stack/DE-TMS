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

@Component({
  selector: 'app-instrument-setup',
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
    ])
  ],
  templateUrl: './instrument-setup.component.html',
  styleUrl:    './instrument-setup.component.scss'
})
export class InstrumentSetupComponent implements OnInit, OnDestroy {

  private approvalsService    = inject(ApprovalsService);
  private router              = inject(Router);
  private cdr                 = inject(ChangeDetectorRef);
  private infobarService      = inject(InfobarService);
  private footerActionService = inject(FooterActionService);
  private formSub             = new Subscription();

  readonly instrumentId = 'INST-2026-001';
  readonly today        = new Date().toISOString().split('T')[0];

  // ── Static options ────────────────────────────────────────────────────────

  readonly typeOptions = [
    { value: 'FTD',   label: 'Fixed Term Deposit'      },
    { value: 'CALL',  label: 'Call Deposit'             },
    { value: 'OND',   label: 'Overnight Deposit'        },
    { value: 'REPO',  label: 'Repo Agreement'           },
    { value: 'TBILL', label: 'Treasury Bill'            },
    { value: 'CD',    label: 'Certificate of Deposit'   },
    { value: 'CP',    label: 'Commercial Paper'         },
  ];

  readonly categoryOptions = [
    { value: 'MM',   label: 'Money Market'  },
    { value: 'CM',   label: 'Capital Market'},
    { value: 'FX',   label: 'FX'            },
  ];

  readonly dayCountOptions = [
    { value: 'ACT365',  label: 'ACT / 365', sub: 'Actual days / 365'    },
    { value: 'ACTACT',  label: 'ACT / ACT', sub: 'Actual / actual year' },
    { value: 'DC30360', label: '30 / 360',  sub: '30-day month / 360'   },
    { value: 'ACT360',  label: 'ACT / 360', sub: 'Actual days / 360'    },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      name:             new FormControl('',           [Validators.required, Validators.maxLength(80)]),
      shortCode:        new FormControl(''),
      category:         new FormControl('MM',         Validators.required),
      instrumentType:   new FormControl(null,         Validators.required),
      pricingType:      new FormControl('NORMAL'),
      cashflow:         new FormControl('SIMPLE'),
      compoundingAllowed: new FormControl(false),
      dayCount:         new FormControl('ACT365',     Validators.required),
      defaultTenor:     new FormControl<number | null>(null),   // optional, days
      effectiveDate:    new FormControl(this.today,   Validators.required),
      status:           new FormControl(true),
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
    this.infobarService.setFields([
      { label: 'INSTRUMENT ID', value: this.instrumentId },
      { label: 'NAME',          value: this.form.get('name')?.value || '' },
      { label: 'TYPE',          value: this.form.get('instrumentType')?.value || '' },
    ]);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.infobarService.setFields([]);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get pricingType()         { return this.form.get('pricingType')?.value as string; }
  get cashflow()            { return this.form.get('cashflow')?.value   as string; }
  get compoundingAllowed()  { return this.form.get('compoundingAllowed')?.value as boolean; }
  get statusActive()        { return this.form.get('status')?.value     as boolean; }
  get selectedDayCount()    { return this.form.get('dayCount')?.value   as string; }
  get selectedCategory()    { return this.form.get('category')?.value   as string; }

  // ── Setters ───────────────────────────────────────────────────────────────

  setPricingType(val: string): void { this.form.patchValue({ pricingType: val }); }
  setCashflow(val: string):    void { this.form.patchValue({ cashflow: val }); }
  setCategory(val: string):    void { this.form.patchValue({ category: val }); }
  setDayCount(val: string):    void { this.form.patchValue({ dayCount: val }); }

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
      `Instrument ${this.instrumentId} submitted for approval. Check Authorization Inbox.`,
      'success'
    );
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  saveDraft(): void {
    this.showToast('Draft saved successfully.', 'info');
  }

  onCancel(): void {
    this.router.navigate(['/instruments']);
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
