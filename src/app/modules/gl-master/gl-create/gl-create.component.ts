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
  selector: 'app-gl-create',
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
  templateUrl: './gl-create.component.html',
  styleUrl:    './gl-create.component.scss'
})
export class GlCreateComponent implements OnInit, OnDestroy {

  private approvalsService    = inject(ApprovalsService);
  private router              = inject(Router);
  private cdr                 = inject(ChangeDetectorRef);
  private infobarService      = inject(InfobarService);
  private footerActionService = inject(FooterActionService);
  private formSub             = new Subscription();

  readonly glNumber = `GL-${new Date().getFullYear()}-0006`;

  dpOpen = true;

  // ── Options ───────────────────────────────────────────────────────────────

  readonly glTypeOptions = [
    { value: 'PRODUCT',    label: 'Product GL'    },
    { value: 'SETTLEMENT', label: 'Settlement GL' },
    { value: 'INCOME',     label: 'Income GL'     },
    { value: 'EXPENSE',    label: 'Expense GL'    },
    { value: 'LIABILITY',  label: 'Liability GL'  },
  ];

  readonly productOptions = [
    { value: 'PROD-2026-001', label: 'FTD Standard'            },
    { value: 'PROD-2026-002', label: 'Call Deposit — General'  },
    { value: 'PROD-2026-003', label: 'Overnight Deposit'       },
    { value: 'PROD-2026-004', label: 'Repo Standard'           },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      glName:     new FormControl('',   [Validators.required, Validators.maxLength(80)]),
      glType:     new FormControl(null,  Validators.required),
      productId:  new FormControl(null),
      externalGl: new FormControl('',   [Validators.pattern(/^\d{15}$/)]),
      description:new FormControl(''),
      status:     new FormControl(true),
    });

    // When GL Type = PRODUCT, productId becomes required
    this.form.get('glType')!.valueChanges.subscribe((type: string | null) => {
      const ctrl = this.form.get('productId')!;
      if (type === 'PRODUCT') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
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
      { label: 'GL CODE',  value: this.glNumber },
      { label: 'GL NAME',  value: this.form.get('glName')?.value || '' },
      { label: 'TYPE',     value: this.form.get('glType')?.value || '' },
    ]);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.infobarService.setFields([]);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get isProductGl()  { return this.form.get('glType')?.value === 'PRODUCT'; }
  get statusActive() { return this.form.get('status')?.value as boolean; }

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
      `GL Account ${this.glNumber} submitted for approval. Check Authorization Inbox.`,
      'success'
    );
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  saveDraft(): void {
    this.showToast('Draft saved successfully.', 'info');
  }

  onCancel(): void {
    this.router.navigate(['/gl-master']);
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
